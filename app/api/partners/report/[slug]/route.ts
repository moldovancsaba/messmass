// WHAT: API endpoint to fetch partner data with related events for public reports
// WHY: Provide shareable partner profile pages with aggregated event information

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';
import { addDerivedMetrics } from '@/lib/projectStatsUtils';
import { resolveReportVariant } from '@/lib/reportVariants';
import { isEventDateInPeriod } from '@/lib/reportPeriods';
import { findPartnerByIdentifier, isUuidV4 } from '@/lib/partnerIdentifier';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let slug: string | undefined;
  try {
    const variantSlug = new URL(request.url).searchParams.get('variant');

    // WHAT: Await params Promise (Next.js 15 requirement)
    // WHY: Next.js 15 changed params to async to support edge runtime
    const paramsResolved = await params;
    slug = paramsResolved.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isMongoObjectId = ObjectId.isValid(slug);
    const isSecureViewSlug = isUuidV4(slug);
    const looksLikeLegacyViewSlug = !slug.includes('/') && slug.trim().length > 0;

    if (!isMongoObjectId && !isSecureViewSlug && !looksLikeLegacyViewSlug) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner identifier format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // WHAT: Support both secure UUID view slugs and legacy human-readable partner slugs
    // WHY: Existing public partner links still reference older viewSlug values in production
    // HOW: Resolve by ObjectId first, then fall back to an exact viewSlug match
    const partner = await findPartnerByIdentifier(db as any, slug);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    const resolvedVariant = await resolveReportVariant(db as any, 'partner', partner._id.toString(), variantSlug);

    const partnerObjectId = new ObjectId(partner._id);
    const showOnlyTeam1Events = resolvedVariant.variant.showOnlyTeam1Events ?? (partner.showOnlyTeam1Events === true);
    const eventQuery = showOnlyTeam1Events
      ? {
          $or: [
            { partner1: partnerObjectId },
            { partner1Id: partnerObjectId },
          ],
        }
      : {
          $or: [
            { partner1: partnerObjectId },
            { partner2: partnerObjectId },
            { partner1Id: partnerObjectId },
            { partner2Id: partnerObjectId },
          ],
        };

    // Fetch all report-eligible events associated with this partner
    // WHAT: partner1 / partner1Id represent the local-home side in existing builders
    // WHY: Some partner reports should aggregate only local-home appearances
    const allEvents = await db
      .collection('projects')
      .find(eventQuery)
      .sort({ eventDate: -1 }) // Most recent events first
      .project({
        _id: 1,
        eventName: 1,
        eventDate: 1,
        viewSlug: 1,
        hashtags: 1,
        categorizedHashtags: 1,
        createdAt: 1,
        updatedAt: 1,
        stats: 1 // WHAT: Include ALL stats fields for proper aggregation
        // WHY: Partner reports need all event data to create comprehensive aggregate stats
        // HOW: Remove field-specific projection and include entire stats object
      })
      .toArray();

    const events = allEvents.filter((event) => isEventDateInPeriod(event.eventDate, resolvedVariant.period));

    const useLegacyAllTimeAggregation = !variantSlug && resolvedVariant.isVirtualDefault && resolvedVariant.period.periodPreset === 'all_time';
    const aggregatedStats: Record<string, number | string> = useLegacyAllTimeAggregation
      ? { ...(partner.stats || {}) }
      : { ...((resolvedVariant.variant.statsOverrides || {}) as Record<string, number | string>) };

    events.forEach(event => {
      const eventStats = event.stats || {};
      Object.entries(eventStats).forEach(([key, value]) => {
        if (typeof value === 'number') {
          const currentValue = aggregatedStats[key];
          // Only aggregate if current value is also a number (or undefined)
          if (typeof currentValue === 'number') {
            aggregatedStats[key] = currentValue + value;
          } else if (currentValue === undefined) {
            aggregatedStats[key] = value;
          }
          // Skip if currentValue is a string (e.g., reportText* fields from partner.stats)
        }
      });
    });

    return NextResponse.json({
      success: true,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        emoji: resolvedVariant.variant.emoji ?? partner.emoji,
        logoUrl: resolvedVariant.variant.logoUrl ?? partner.logoUrl,
        hashtags: partner.hashtags || [],
        categorizedHashtags: partner.categorizedHashtags || {},
        styleId: resolvedVariant.variant.styleId || (partner.styleId ? partner.styleId.toString() : undefined),
        reportTemplateId: resolvedVariant.variant.reportTemplateId || (partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined),
        showEventsList: resolvedVariant.variant.showEventsList ?? partner.showEventsList ?? true,
        showEventsListTitle: resolvedVariant.variant.showEventsListTitle ?? partner.showEventsListTitle ?? true,
        showEventsListDetails: resolvedVariant.variant.showEventsListDetails ?? partner.showEventsListDetails ?? true,
        showEmoji: resolvedVariant.variant.showEmoji ?? partner.showEmoji ?? true,
        showOnlyTeam1Events,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        // WHAT: Include partner-level stats (reportText*, reportImage*) for chart display
        // WHY: Partner editor creates content that should appear in partner reports
        // HOW: Pass partner.stats to frontend for merging with aggregated event data
        stats: useLegacyAllTimeAggregation ? partner.stats || {} : resolvedVariant.variant.statsOverrides || {}
      },
      // WHAT: Pre-aggregated stats computed on server (Phase 2 - v12.4.0)
      // WHY: Eliminates client-side computation, improves performance
      // HOW: Sum all numeric event stats + merge partner-level stats (reportText*, reportImage*)
      aggregatedStats,
      reportVariant: {
        ...resolvedVariant.variant,
        period: resolvedVariant.period,
      },
      report: resolvedVariant.runtimeReport.report,
      resolvedFrom: resolvedVariant.runtimeReport.resolvedFrom,
      source: resolvedVariant.runtimeReport.source,
      events: events.map(event => {
        const rawStats = event.stats || {};
        const derivedStats = addDerivedMetrics(rawStats);
        const storedTotalFans = toFiniteNumber((rawStats as Record<string, unknown>).totalFans);
        return {
          _id: event._id.toString(),
          eventName: event.eventName,
          eventDate: event.eventDate,
          viewSlug: event.viewSlug,
          hashtags: event.hashtags || [],
          categorizedHashtags: event.categorizedHashtags || {},
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          stats: {
            ...derivedStats,
            totalFans: storedTotalFans ?? derivedStats.totalFans,
          }
        };
      }),
      totalEvents: events.length
    });
  } catch (error) {
    logError('Failed to fetch partner report', { context: 'partners-report', slug: slug || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner report' 
      },
      { status: 500 }
    );
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
