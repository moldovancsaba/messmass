// app/api/public/partners/route.ts
// WHAT: Public API endpoint for listing partners
// WHY: Enable third-party integrations to read partner data with Bearer token auth

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireAPIAuth } from '@/lib/apiAuth';
import { applyCorsHeaders } from '@/lib/cors';
import { logRequestStart, logRequestEnd } from '@/lib/logger';

// WHAT: Force Node.js runtime
// WHY: Uses MongoDB operations and crypto functions
export const runtime = 'nodejs';

/**
 * GET /api/public/partners
 * WHAT: List partners with search and pagination
 * WHY: Third-party integrations need partner catalog access
 * 
 * AUTH: Bearer token required (API key)
 * QUERY PARAMS:
 *   - search: Search term (filters by name)
 *   - limit: Pagination limit (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 *   - sortField: Field to sort by (name | createdAt)
 *   - sortOrder: Sort direction (asc | desc)
 * 
 * RESPONSE:
 *   - partners: Array of partner objects
 *   - pagination: { total, limit, offset, hasMore }
 *   - timestamp: ISO 8601 with milliseconds
 * 
 * SECURITY:
 *   - Bearer token authentication only (no cookies)
 *   - CORS enabled for allowed origins
 *   - Rate limited (1000 req/min for authenticated users)
 *   - Sensitive fields excluded (bitlyLinkIds, internal metadata)
 */
export async function GET(request: NextRequest) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: '/api/public/partners',
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });
  
  try {
    // WHAT: Require Bearer token authentication
    // WHY: Public API must never accept session cookies
    const authResult = await requireAPIAuth(request);
    if (!authResult.success) {
      logRequestEnd(startTime, { method: 'GET', pathname: '/api/public/partners' }, 401);
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const sortField = searchParams.get('sortField') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // WHAT: Build MongoDB query filter
    const filter: any = {};
    
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
      filter.name = searchRegex;
    }
    
    // WHAT: Build sort options
    const sortOptions: any = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'name':
        sortOptions.name = order;
        break;
      case 'createdAt':
        sortOptions.createdAt = order;
        break;
      default:
        sortOptions.name = 1; // Default to name ascending
        break;
    }
    
    // WHAT: Query database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const partners = await db
      .collection('partners')
      .find(filter)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // WHAT: Count total matching documents
    const total = await db.collection('partners').countDocuments(filter);
    
    // WHAT: Sanitize partner data for public API
    // WHY: Remove sensitive internal fields
    const sanitizedPartners = partners.map(partner => ({
      id: partner._id.toString(),
      name: partner.name,
      emoji: partner.emoji,
      logoUrl: partner.logoUrl || null,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      // WHAT: Include TheSportsDB metadata if available
      // WHY: Third parties may need sports team information
      sportsDb: partner.sportsDb ? {
        teamId: partner.sportsDb.teamId,
        teamName: partner.sportsDb.teamName,
        league: partner.sportsDb.league,
        sport: partner.sportsDb.sport
      } : null,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt
    }));
    
    logRequestEnd(startTime, {
      method: 'GET',
      pathname: '/api/public/partners',
      userId: authResult.user?.id
    }, 200);
    
    // WHAT: Build response with CORS headers
    const response = NextResponse.json({
      success: true,
      partners: sanitizedPartners,
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
    console.error('[GET /api/public/partners] Error:', error);
    logRequestEnd(startTime, { method: 'GET', pathname: '/api/public/partners' }, 500);
    
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

/**
 * OPTIONS /api/public/partners
 * WHAT: Handle CORS preflight requests
 * WHY: Required for cross-origin API calls from browsers
 */
export async function OPTIONS(request: NextRequest) {
  // WHAT: Return 204 No Content with CORS headers
  // WHY: Browsers send OPTIONS before actual request
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}
