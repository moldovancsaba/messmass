/**
 * Analytics Insights API - Organization Route
 *
 * WHAT: REST API for fetching insights for a specific organization
 * WHY: Strategic overview of organization performance across member partners (#233 AC#3)
 *
 * Endpoint: GET /api/analytics/insights/organizations/[orgId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { generateOrganizationInsights } from '@/lib/analytics-insights';

/**
 * GET /api/analytics/insights/organizations/[orgId]
 *
 * WHAT: Fetch organization-level insights across the org's member-partner events
 * WHY: Adds organization as an insights reporting scope, matching the partner route
 *
 * @param orgId - MongoDB ObjectId of the organization
 * @returns InsightsReport based on the org's latest event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    // WHAT: Admin authentication required
    // WHY: Organization insights contain sensitive business data
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // WHAT: Validate orgId format
    // WHY: Prevent invalid MongoDB queries
    if (!/^[0-9a-fA-F]{24}$/.test(orgId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID format' },
        { status: 400 }
      );
    }

    // WHAT: Generate organization insights
    // WHY: Analyze organization performance across member partners
    const insights = await generateOrganizationInsights(orgId);

    return NextResponse.json(insights);
  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error generating organization insights for ${resolvedParams.orgId}:`, error);

    // WHAT: Handle specific error cases
    // WHY: Provide useful feedback to client
    if ((error as Error).message.includes('not found') || (error as Error).message.includes('No events')) {
      return NextResponse.json(
        { error: 'Organization not found or has no events' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate organization insights',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
