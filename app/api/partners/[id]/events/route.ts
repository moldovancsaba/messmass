// app/api/partners/[id]/events/route.ts
// WHAT: Admin API endpoint for fetching all events (projects) for a partner
// WHY: Partner KYC Data page needs to aggregate stats across partner events
// HOW: Query projects collection by partnerId field

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export const runtime = 'nodejs';

/**
 * GET /api/partners/[id]/events
 * WHAT: List all events (projects) for a specific partner with full stats
 * WHY: Partner KYC Data page aggregates metrics across all partner events
 * 
 * RESPONSE:
 *   - success: boolean
 *   - events: Array of project objects with full stats
 *   - partner: Partner summary
 *   - timestamp: ISO 8601 with milliseconds
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 [Partner Events API] Fetching events for partner:', id);
    
    // WHAT: Validate partner ID
    if (!ObjectId.isValid(id)) {
      console.error('❌ [Partner Events API] Invalid partner ID format:', id);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid partner ID format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // WHAT: Verify partner exists
    const partner = await db
      .collection('partners')
      .findOne({ _id: new ObjectId(id) });
    
    if (!partner) {
      console.error('❌ [Partner Events API] Partner not found:', id);
      return NextResponse.json(
        {
          success: false,
          error: 'Partner not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    console.log('✅ [Partner Events API] Found partner:', partner.name);
    
    // WHAT: Query projects (events) for this partner
    // WHY: Projects have partnerId field linking them to partners
    // NOTE: Using partner1Id OR partner2Id to catch both home and away matches
    const projects = await db
      .collection('projects')
      .find({
        $or: [
          { partnerId: new ObjectId(id) },     // Legacy single partner field
          { partner1Id: new ObjectId(id) },    // Sports Match Builder (home team)
          { partner2Id: new ObjectId(id) }     // Sports Match Builder (away team)
        ]
      })
      .sort({ eventDate: -1 })
      .toArray();
    
    console.log(`✅ [Partner Events API] Found ${projects.length} events for partner ${partner.name}`);
    
    // WHAT: Format project data with full stats for aggregation
    // WHY: Partner KYC page needs complete stats to compute totals
    const formattedEvents = projects.map(project => ({
      _id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      stats: project.stats || {},
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      events: formattedEvents,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Partner Events API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
