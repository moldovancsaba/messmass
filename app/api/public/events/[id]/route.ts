// app/api/public/events/[id]/route.ts
// WHAT: Public API endpoint for single event details
// WHY: Third parties need complete event/project data including statistics

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/public/events/[id]
 * WHAT: Get complete details for a specific event (project)
 * WHY: Third parties need full event data including all statistics
 * 
 * AUTH: Bearer token required
 * PATH PARAMS:
 *   - id: Project/Event ObjectId
 * 
 * QUERY PARAMS:
 *   - includeStats: Include full statistics object (default: true)
 * 
 * RESPONSE:
 *   - event: Complete event object with all fields
 *   - timestamp: ISO 8601 with milliseconds
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: `/api/public/events/[id]`,
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });
  
  try {
    const { id } = await params;
    
    // WHAT: Require Bearer token authentication
    const authResult = await requireAPIAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/events/${id}` }, 401);
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Validate event ID format
    if (!ObjectId.isValid(id)) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/events/${id}` }, 400);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid event ID format',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') !== 'false'; // Default true
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // WHAT: Query project (event) from database
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(id) });
    
    if (!project) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/events/${id}` }, 404);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
      return applyCorsHeaders(response, request);
    }
    
    // WHAT: Fetch partner details if partnerId exists
    // WHY: Third parties want to know which organization owns the event
    let partnerInfo = null;
    if (project.partnerId) {
      const partner = await db
        .collection('partners')
        .findOne({ _id: new ObjectId(project.partnerId) });
      
      if (partner) {
        partnerInfo = {
          id: partner._id.toString(),
          name: partner.name,
          emoji: partner.emoji,
          logoUrl: partner.logoUrl || null
        };
      }
    }
    
    // WHAT: Sanitize event data for public API
    const sanitizedEvent: any = {
      id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {},
      partner: partnerInfo,
      // WHAT: Include match context if available
      matchContext: project.matchContext ? {
        opponentId: project.matchContext.opponentId?.toString(),
        opponentName: project.matchContext.opponentName,
        isHomeGame: project.matchContext.isHomeGame,
        venue: project.matchContext.venue,
        fixtureId: project.matchContext.fixtureId,
        scoreHome: project.matchContext.scoreHome,
        scoreAway: project.matchContext.scoreAway
      } : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
    
    // WHAT: Include full statistics if requested
    // WHY: Stats object can be large (96+ variables), so make it optional
    if (includeStats && project.stats) {
      sanitizedEvent.stats = project.stats;
    }
    
    logRequestEnd(startTime, {
      method: 'GET',
      pathname: `/api/public/events/${id}`,
      userId: authResult.user?.id
    }, 200);
    
    const response = NextResponse.json({
      success: true,
      event: sanitizedEvent,
      timestamp: new Date().toISOString()
    });
    
    return applyCorsHeaders(response, request);
    
  } catch (error) {
    console.error('[GET /api/public/events/[id]] Error:', error);
    const { id } = await params;
    logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/events/${id}` }, 500);
    
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
