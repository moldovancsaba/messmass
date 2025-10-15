/**
 * Analytics Insights API - Event Route
 * 
 * WHAT: REST API for fetching insights for a specific event
 * WHY: Detailed insights view for individual events
 * 
 * Endpoint: GET /api/analytics/insights/[eventId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { generateInsights } from '@/lib/analytics-insights';

/**
 * GET /api/analytics/insights/[eventId]
 * 
 * WHAT: Fetch complete insights report for specific event
 * WHY: Detailed analysis with anomalies, trends, benchmarks, and predictions
 * 
 * @param eventId - MongoDB ObjectId of the event
 * @returns Complete InsightsReport
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // WHAT: Admin authentication required
    // WHY: Insights contain sensitive business intelligence
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // WHAT: Validate eventId format
    // WHY: Prevent invalid MongoDB queries
    if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // WHAT: Generate insights for event
    // WHY: Single comprehensive report with all insight types
    const insights = await generateInsights(eventId);

    return NextResponse.json(insights);
  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error generating insights for event ${resolvedParams.eventId}:`, error);

    // WHAT: Handle specific error cases
    // WHY: Provide useful feedback to client
    if ((error as Error).message.includes('not found')) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if ((error as Error).message.includes('Insufficient')) {
      return NextResponse.json(
        {
          error: 'Insufficient data',
          details: (error as Error).message,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
