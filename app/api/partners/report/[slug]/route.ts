// WHAT: API endpoint to fetch partner data with related events for public reports
// WHY: Provide shareable partner profile pages with aggregated event information

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let slug: string | undefined;
  try {
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

    // WHAT: Validate secure ID format (MongoDB ObjectId OR UUID v4)
    // WHY: Prevent slug-based URL guessing attacks (reject human-readable slugs)
    // HOW: Accept cryptographically random identifiers only
    
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (32 hex + 4 dashes)
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isMongoObjectId = ObjectId.isValid(slug);
    const isUuidV4 = uuidV4Pattern.test(slug);
    
    if (!isMongoObjectId && !isUuidV4) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID format - secure UUID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // WHAT: Find partner by _id (MongoDB ObjectId) OR viewSlug (UUID v4)
    // WHY: Both formats are cryptographically secure (prevent URL guessing)
    // HOW: UUID v4 uses viewSlug lookup, ObjectId uses _id lookup
    let partner;
    if (isMongoObjectId) {
      partner = await db.collection('partners').findOne({ _id: new ObjectId(slug) });
    } else {
      // UUID v4 format - lookup by viewSlug (secure)
      partner = await db.collection('partners').findOne({ viewSlug: slug });
    }

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Fetch all events associated with this partner
    // WHAT: Events can reference partner as partner1/partner2 OR partner1Id/partner2Id (home/away)
    // WHY: Sports Match Builder creates events with two partners, field names vary by creation method
    const partnerObjectId = new ObjectId(partner._id);
    const events = await db
      .collection('projects')
      .find({
        $or: [
          { partner1: partnerObjectId },
          { partner2: partnerObjectId },
          { partner1Id: partnerObjectId },
          { partner2Id: partnerObjectId }
        ]
      })
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

    // WHAT: Server-side stats aggregation (Phase 2 - v12.4.0)
    // WHY: Move computation to server for better performance and consistency
    // HOW: Sum all numeric stats across events, merge with partner-level stats
    const aggregatedStats: Record<string, number | string> = { ...(partner.stats || {}) };
    
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
        emoji: partner.emoji,
        logoUrl: partner.logoUrl,
        hashtags: partner.hashtags || [],
        categorizedHashtags: partner.categorizedHashtags || {},
        styleId: partner.styleId ? partner.styleId.toString() : undefined,
        reportTemplateId: partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined,
        showEventsList: partner.showEventsList ?? true, // Default to true for backward compatibility
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        // WHAT: Include partner-level stats (reportText*, reportImage*) for chart display
        // WHY: Partner editor creates content that should appear in partner reports
        // HOW: Pass partner.stats to frontend for merging with aggregated event data
        stats: partner.stats || {}
      },
      // WHAT: Pre-aggregated stats computed on server (Phase 2 - v12.4.0)
      // WHY: Eliminates client-side computation, improves performance
      // HOW: Sum all numeric event stats + merge partner-level stats (reportText*, reportImage*)
      aggregatedStats,
      events: events.map(event => ({
        _id: event._id.toString(),
        eventName: event.eventName,
        eventDate: event.eventDate,
        viewSlug: event.viewSlug,
        hashtags: event.hashtags || [],
        categorizedHashtags: event.categorizedHashtags || {},
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        stats: event.stats || {}
      })),
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
