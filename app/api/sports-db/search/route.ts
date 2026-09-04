// app/api/sports-db/search/route.ts
// TheSportsDB search endpoint for teams and venues
// GET /api/sports-db/search?type=team&query={name}
// GET /api/sports-db/search?type=venue&query={name}

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/apiGuards';
import { searchTeams } from '@/lib/sportsDbApi';
import type { SportsDbTeam } from '@/lib/sportsDbTypes';

/**
 * WHAT: Search TheSportsDB for teams or venues by name
 * WHY: Enable partner-to-team matching in admin UI
 * REQUIRES: Admin authentication (add middleware if needed)
 */
export async function GET(request: NextRequest) {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    
    // Validate required parameters
    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: type',
          message: 'Please specify type (team or venue)'
        },
        { status: 400 }
      );
    }
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: query',
          message: 'Please provide a search query'
        },
        { status: 400 }
      );
    }
    
    // Validate type
    if (type !== 'team' && type !== 'venue') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type parameter',
          message: 'Type must be either "team" or "venue"'
        },
        { status: 400 }
      );
    }
    
    // Perform search based on type
    let results: SportsDbTeam[] = [];
    
    if (type === 'team') {
      results = await searchTeams(query);
    } else if (type === 'venue') {
      // Note: TheSportsDB free tier doesn't have venue search
      // We can search teams and filter by venue name as workaround
      const teams = await searchTeams(query);
      // Filter teams whose stadium matches the query
      results = teams.filter(team => 
        team.strStadium?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Return successful response with caching
    return NextResponse.json(
      {
        success: true,
        type,
        query,
        count: results.length,
        results
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store' /* SECURITY (messmass#386): was public+s-maxage - a CDN must not serve session-guarded responses to anonymous callers */,
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('[SportsDB Search API] Error:', error);
    
    // Handle different error types
    if (error instanceof Error) {
      // Rate limit error
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            message: 'TheSportsDB API rate limit reached. Please try again in a minute.',
            retryAfter: 60
          },
          { status: 429 }
        );
      }
      
      // Timeout error
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout',
            message: 'TheSportsDB API request timed out. Please try again.'
          },
          { status: 504 }
        );
      }
      
      // API unavailable
      if (error.message.includes('ENOTFOUND') || error.message.includes('503')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Service unavailable',
            message: 'TheSportsDB API is currently unavailable.'
          },
          { status: 503 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to search TheSportsDB. Please try again later.'
      },
      { status: 500 }
    );
  }
}

/**
 * WHAT: Handle unsupported HTTP methods
 * WHY: Provide clear error messages for incorrect usage
 */
export async function POST() {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    },
    { status: 405 }
  );
}

export async function PUT() {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    },
    { status: 405 }
  );
}

export async function DELETE() {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    },
    { status: 405 }
  );
}
