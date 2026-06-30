// WHAT: API endpoint to fetch partner data for editing (partner-level content only)
// WHY: Enable partner-level editing of text and image content while keeping math data from events

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';
import { listReportVariants, resolveReportVariant, updateReportVariant } from '@/lib/reportVariants';
import { findPartnerByIdentifier, isUuidV4 } from '@/lib/partnerIdentifier';

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

    const partner = await findPartnerByIdentifier(db as any, slug);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    const variantSlug = new URL(request.url).searchParams.get('variant');

    // WHAT: Return partner data with stats structure for content editing
    // WHY: Partner editor needs same structure as event editor but only for content fields
    // HOW: Initialize empty stats object if none exists, preserve existing content
    const partnerData = {
      _id: partner._id.toString(),
      name: partner.name,
      viewSlug: partner.viewSlug,
      emoji: partner.emoji,
      showEmoji: partner.showEmoji ?? true,
      logoUrl: partner.logoUrl,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      styleId: partner.styleId ? partner.styleId.toString() : undefined,
      reportTemplateId: partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined,
      showEventsList: partner.showEventsList ?? true, // Default to true for backward compatibility
      showEventsListTitle: partner.showEventsListTitle ?? true, // Default to true for backward compatibility
      showEventsListDetails: partner.showEventsListDetails ?? true, // Default to true for backward compatibility
      showOnlyTeam1Events: partner.showOnlyTeam1Events ?? false,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      // WHAT: Partner stats for content editing (reportText*, reportImage*)
      // WHY: Store partner-level customizations separate from event aggregation
      // HOW: Initialize empty object if no stats exist, preserve existing content
      stats: partner.stats || {}
    };

    if (variantSlug && variantSlug !== 'default') {
      const resolvedVariant = await resolveReportVariant(db as any, 'partner', partner._id.toString(), variantSlug);

      return NextResponse.json({
        success: true,
        partner: {
          ...partnerData,
          emoji: resolvedVariant.variant.emoji ?? partnerData.emoji,
          logoUrl: resolvedVariant.variant.logoUrl ?? partnerData.logoUrl,
          styleId: resolvedVariant.variant.styleId ?? partnerData.styleId,
          reportTemplateId: resolvedVariant.variant.reportTemplateId ?? partnerData.reportTemplateId,
          showEmoji: resolvedVariant.variant.showEmoji ?? partnerData.showEmoji,
          showEventsList: resolvedVariant.variant.showEventsList ?? partnerData.showEventsList,
          showEventsListTitle: resolvedVariant.variant.showEventsListTitle ?? partnerData.showEventsListTitle,
          showEventsListDetails: resolvedVariant.variant.showEventsListDetails ?? partnerData.showEventsListDetails,
          stats: resolvedVariant.variant.statsOverrides || {},
          reportVariant: resolvedVariant.variant,
        },
      });
    }

    return NextResponse.json({
      success: true,
      partner: partnerData
    });
  } catch (error) {
    logError('Failed to fetch partner for editing', { context: 'partners-edit', slug: slug || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner for editing' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let slug: string | undefined;
  try {
    const paramsResolved = await params;
    slug = paramsResolved.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const isMongoObjectId = ObjectId.isValid(slug);
    const isSecureViewSlug = isUuidV4(slug);
    const looksLikeLegacyViewSlug = !slug.includes('/') && slug.trim().length > 0;

    if (!isMongoObjectId && !isSecureViewSlug && !looksLikeLegacyViewSlug) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner identifier format' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      metadata?: {
        emoji?: string;
        logoUrl?: string;
        stats?: Record<string, unknown>;
        reportTemplateId?: string;
        styleId?: string;
        showEmoji?: boolean;
        showEventsList?: boolean;
        showEventsListTitle?: boolean;
        showEventsListDetails?: boolean;
        showOnlyTeam1Events?: boolean;
      };
    } | null;

    if (!body?.metadata) {
      return NextResponse.json({ success: false, error: 'metadata is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    const partner = await findPartnerByIdentifier(db as any, slug);

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const variantSlug = new URL(request.url).searchParams.get('variant');
    if (!variantSlug || variantSlug === 'default') {
      return NextResponse.json(
        { success: false, error: 'Only custom partner variants can be updated through this route' },
        { status: 400 }
      );
    }

    const { variants } = await listReportVariants(db as any, 'partner', partner._id.toString());
    const targetVariant = variants.find((variant) => variant.slug === variantSlug || variant._id === variantSlug);
    if (!targetVariant || targetVariant._id.startsWith('virtual-default:')) {
      return NextResponse.json({ success: false, error: 'Report variant not found' }, { status: 404 });
    }

    const metadata = body.metadata;
    const variant = await updateReportVariant(db as any, targetVariant._id, {
      statsOverrides: metadata.stats || {},
      emoji: metadata.emoji ? String(metadata.emoji) : undefined,
      logoUrl: metadata.logoUrl ? String(metadata.logoUrl) : undefined,
      styleId: metadata.styleId ? String(metadata.styleId) : undefined,
      reportTemplateId: metadata.reportTemplateId ? String(metadata.reportTemplateId) : undefined,
      showEmoji: metadata.showEmoji,
      showEventsList: metadata.showEventsList,
      showEventsListTitle: metadata.showEventsListTitle,
      showEventsListDetails: metadata.showEventsListDetails,
      showOnlyTeam1Events: metadata.showOnlyTeam1Events,
    });

    return NextResponse.json({
      success: true,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        viewSlug: partner.viewSlug,
        emoji: variant.emoji ?? partner.emoji,
        logoUrl: variant.logoUrl ?? partner.logoUrl,
        hashtags: partner.hashtags || [],
        categorizedHashtags: partner.categorizedHashtags || {},
        styleId: variant.styleId ?? (partner.styleId ? partner.styleId.toString() : undefined),
        reportTemplateId: variant.reportTemplateId ?? (partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined),
        showEventsList: variant.showEventsList ?? partner.showEventsList ?? true,
        showEventsListTitle: variant.showEventsListTitle ?? partner.showEventsListTitle ?? true,
        showEventsListDetails: variant.showEventsListDetails ?? partner.showEventsListDetails ?? true,
        showOnlyTeam1Events: variant.showOnlyTeam1Events ?? partner.showOnlyTeam1Events ?? false,
        createdAt: partner.createdAt,
        updatedAt: new Date().toISOString(),
        stats: variant.statsOverrides || {},
        reportVariant: variant,
      },
    });
  } catch (error) {
    logError('Failed to update partner variant for editing', { context: 'partners-edit-put', slug: slug || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update partner variant for editing',
      },
      { status: 500 }
    );
  }
}
