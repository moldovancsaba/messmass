/**
 * Analytics Insights API - Partner Route
 * 
 * WHAT: REST API for fetching insights for a specific partner
 * WHY: Strategic overview of partner performance
 * 
 * Endpoint: GET /api/analytics/insights/partners/[partnerId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { generatePartnerInsights } from '@/lib/analytics-insights';

/**
 * GET /api/analytics/insights/partners/[partnerId]
 * 
 * WHAT: Fetch partner-level insights across all partner events
 * WHY: Strategic analysis for partner organizations
 * 
 * @param partnerId - MongoDB ObjectId of the partner
 * @returns InsightsReport based on partner's latest event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    // WHAT: Admin authentication required
    // WHY: Partner insights contain sensitive business data
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId } = await params;

    // WHAT: Validate partnerId format
    // WHY: Prevent invalid MongoDB queries
    if (!/^[0-9a-fA-F]{24}$/.test(partnerId)) {
      return NextResponse.json(
        { error: 'Invalid partner ID format' },
        { status: 400 }
      );
    }

    // WHAT: Generate partner insights
    // WHY: Analyze partner performance trends
    const insights = await generatePartnerInsights(partnerId);

    return NextResponse.json(insights);
  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error generating partner insights for ${resolvedParams.partnerId}:`, error);

    // WHAT: Handle specific error cases
    // WHY: Provide useful feedback to client
    if ((error as Error).message.includes('not found') || (error as Error).message.includes('No events')) {
      return NextResponse.json(
        { error: 'Partner not found or has no events' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate partner insights',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
