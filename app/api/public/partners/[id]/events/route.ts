// app/api/public/partners/[id]/events/route.ts
// WHAT: Public API endpoint for listing events by partner
// WHY: Third parties need to query events for specific partners/organizations

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/public/partners/[id]/events
 * WHAT: List all events (projects) for a specific partner
 * WHY: Third parties need event catalog for organizations they work with
 * 
 * AUTH: Bearer token required
 * PATH PARAMS:
 *   - id: Partner ObjectId
 * 
 * QUERY PARAMS:
 *   - limit: Pagination limit (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 *   - sortOrder: Sort direction (asc | desc, default: desc by eventDate)
 * 
 * RESPONSE:
 *   - events: Array of event objects
 *   - partner: Partner summary
 *   - pagination: { total, limit, offset, hasMore }
 *   - timestamp: ISO 8601 with milliseconds
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: `/api/public/partners/[id]/events`,
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });
  
  try {
    const { id } = await params;
    
    // WHAT: Require Bearer token authentication
    const authResult = await requireAPIAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}/events` }, 401);
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Validate partner ID
    if (!ObjectId.isValid(id)) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid partner ID format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // WHAT: Verify partner exists
    const partner = await db
      .collection('partners')
      .findOne({ _id: new ObjectId(id) });
    
    if (!partner) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}/events` }, 404);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Partner not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Query projects (events) for this partner
    // WHY: Projects have partnerId field linking them to partners
    const projects = await db
      .collection('projects')
      .find({ partnerId: new ObjectId(id) })
      .sort({ eventDate: sortOrder })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    const total = await db
      .collection('projects')
      .countDocuments({ partnerId: new ObjectId(id) });
    
    // WHAT: Sanitize project data for public API
    // WHY: Remove internal fields, keep essential event information
    const sanitizedEvents = projects.map(project => ({
      id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      // WHAT: Include match context if available (from Sports Match Builder)
      // WHY: Third parties need opponent and result information
      matchContext: project.matchContext ? {
        opponentId: project.matchContext.opponentId?.toString(),
        opponentName: project.matchContext.opponentName,
        isHomeGame: project.matchContext.isHomeGame,
        venue: project.matchContext.venue
      } : null,
      // WHAT: Include high-level statistics only
      // WHY: Full stats available via /api/public/events/[id]
      summary: {
        totalImages: (project.stats?.remoteImages || 0) + 
                     (project.stats?.hostessImages || 0) + 
                     (project.stats?.selfies || 0),
        totalFans: (project.stats?.remoteFans || 0) + 
                   (project.stats?.stadium || 0),
        eventAttendees: project.stats?.eventAttendees || 0
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    
    logRequestEnd(startTime, {
      method: 'GET',
      pathname: `/api/public/partners/${id}/events`,
      userId: authResult.user?.id
    }, 200);
    
    const response = NextResponse.json({
      success: true,
      events: sanitizedEvents,
      partner: {
        id: partner._id.toString(),
        name: partner.name,
        emoji: partner.emoji
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      timestamp: new Date().toISOString()
    });
    
    return applyCorsHeaders(response, request);
    
  } catch (error) {
    console.error('[GET /api/public/partners/[id]/events] Error:', error);
    const { id } = await params;
    logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}/events` }, 500);
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    
    return applyCorsHeaders(response, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}
