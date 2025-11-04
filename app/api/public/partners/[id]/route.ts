// app/api/public/partners/[id]/route.ts
// WHAT: Public API endpoint for single partner details
// WHY: Third-party integrations need individual partner data access

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/public/partners/[id]
 * WHAT: Get details for a specific partner
 * WHY: Third parties need to fetch individual partner information
 * 
 * AUTH: Bearer token required
 * PATH PARAMS:
 *   - id: Partner ObjectId or identifier
 * 
 * RESPONSE:
 *   - partner: Partner object with all public fields
 *   - timestamp: ISO 8601 with milliseconds
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: `/api/public/partners/[id]`,
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });
  
  try {
    // WHAT: Await params Promise (Next.js 15 requirement)
    const { id } = await params;
    
    // WHAT: Require Bearer token authentication
    const authResult = await requireAPIAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}` }, 401);
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Validate partner ID format
    if (!ObjectId.isValid(id)) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}` }, 400);
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
    
    // WHAT: Query database for partner
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const partner = await db
      .collection('partners')
      .findOne({ _id: new ObjectId(id) });
    
    if (!partner) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}` }, 404);
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
    
    // WHAT: Sanitize partner data for public API
    const sanitizedPartner = {
      id: partner._id.toString(),
      name: partner.name,
      emoji: partner.emoji,
      logoUrl: partner.logoUrl || null,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      sportsDb: partner.sportsDb ? {
        teamId: partner.sportsDb.teamId,
        teamName: partner.sportsDb.teamName,
        league: partner.sportsDb.league,
        sport: partner.sportsDb.sport
      } : null,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt
    };
    
    logRequestEnd(startTime, {
      method: 'GET',
      pathname: `/api/public/partners/${id}`,
      userId: authResult.user?.id
    }, 200);
    
    const response = NextResponse.json({
      success: true,
      partner: sanitizedPartner,
      timestamp: new Date().toISOString()
    });
    
    return applyCorsHeaders(response, request);
    
  } catch (error) {
    console.error('[GET /api/public/partners/[id]] Error:', error);
    const { id } = await params;
    logRequestEnd(startTime, { method: 'GET', pathname: `/api/public/partners/${id}` }, 500);
    
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
