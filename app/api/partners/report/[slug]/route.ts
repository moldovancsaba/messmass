// WHAT: API endpoint to fetch partner data with related events for public reports
// WHY: Provide shareable partner profile pages with aggregated event information

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
    const db = client.db(process.env.MONGODB_DB);

    // Fetch partner by viewSlug
    const partner = await db.collection('partners').findOne({ viewSlug: slug });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Fetch all events associated with this partner
    // WHAT: Events can reference partner as partner1Id OR partner2Id (home/away)
    // WHY: Sports Match Builder creates events with two partners
    const partnerObjectId = new ObjectId(partner._id);
    const events = await db
      .collection('projects')
      .find({
        $or: [
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
        'stats.remoteImages': 1,
        'stats.hostessImages': 1,
        'stats.selfies': 1,
        'stats.remoteFans': 1,
        'stats.stadium': 1,
        'stats.eventAttendees': 1
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
        updatedAt: partner.updatedAt
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
