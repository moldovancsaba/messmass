// app/api/sports-db/lookup/route.ts
// TheSportsDB lookup endpoint for detailed entity information
// GET /api/sports-db/lookup?type=team&id={id}
// GET /api/sports-db/lookup?type=venue&id={id}
// GET /api/sports-db/lookup?type=league&id={id}

import { NextRequest, NextResponse } from 'next/server';
import { lookupTeam, lookupVenue, lookupLeague } from '@/lib/sportsDbApi';

/**
 * WHAT: Lookup detailed information for team/venue/league by ID
 * WHY: Fetch complete metadata after user selects a team from search results
 * REQUIRES: Admin authentication (add middleware if needed)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    // Validate required parameters
    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: type',
          message: 'Please specify type (team, venue, or league)'
        },
        { status: 400 }
      );
    }
    
    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: id',
          message: 'Please provide an entity ID'
        },
        { status: 400 }
      );
    }
    
    // Validate type
    if (type !== 'team' && type !== 'venue' && type !== 'league') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type parameter',
          message: 'Type must be "team", "venue", or "league"'
        },
        { status: 400 }
      );
    }
    
    // Perform lookup based on type
    let result = null;
    
    if (type === 'team') {
      result = await lookupTeam(id);
    } else if (type === 'venue') {
      result = await lookupVenue(id);
    } else if (type === 'league') {
      result = await lookupLeague(id);
    }
    
    // Handle not found
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} with ID "${id}" not found`
        },
        { status: 404 }
      );
    }
    
    // Return successful response with aggressive caching (24 hours)
    return NextResponse.json(
      {
        success: true,
        type,
        id,
        result
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('[SportsDB Lookup API] Error:', error);
    
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
      
      // Invalid ID format
      if (error.message.includes('Invalid') || error.message.includes('400')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid ID',
            message: 'The provided ID is invalid or malformed.'
          },
          { status: 400 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to lookup entity in TheSportsDB. Please try again later.'
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
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    },
    { status: 405 }
  );
}
