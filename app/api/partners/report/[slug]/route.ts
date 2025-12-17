// WHAT: API endpoint to fetch partner data with related events for public reports
// WHY: Provide shareable partner profile pages with aggregated event information

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // WHAT: Await params Promise (Next.js 15 requirement)
    // WHY: Next.js 15 changed params to async to support edge runtime
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner slug is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // Fetch partner by viewSlug
    const partner = await db.collection('partners').findOne({ viewSlug: slug });

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
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        // WHAT: Include partner-level stats (reportText*, reportImage*) for chart display
        // WHY: Partner editor creates content that should appear in partner reports
        // HOW: Pass partner.stats to frontend for merging with aggregated event data
        stats: partner.stats || {}
      },
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
    console.error('Failed to fetch partner report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner report' 
      },
      { status: 500 }
    );
  }
}
