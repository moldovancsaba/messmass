// app/api/stats/route.ts
// WHAT: General stats endpoint
// WHY: Provide stats information (redirects to appropriate endpoint)
// HOW: Return basic stats or redirect to project-specific stats

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/stats
 * WHAT: Get general stats information
 * WHY: Provide a fallback for stats requests
 * 
 * QUERY PARAMS:
 *   - slug: Project slug (optional)
 *   - id: Project ID (optional)
 * 
 * RESPONSE:
 *   - success: boolean
 *   - message: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    
    if (slug) {
      // Redirect to project stats endpoint
      return NextResponse.redirect(
        new URL(`/api/projects/stats/${slug}`, request.url)
      );
    }
    
    if (id) {
      // Redirect to project endpoint
      return NextResponse.redirect(
        new URL(`/api/projects/${id}`, request.url)
      );
    }
    
    // No specific stats requested
    return NextResponse.json({
      success: true,
      message: 'Stats endpoint - provide slug or id parameter',
      available: true
    });
    
  } catch (error) {
    console.error('[GET /api/stats] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get stats'
      },
      { status: 500 }
    );
  }
}
