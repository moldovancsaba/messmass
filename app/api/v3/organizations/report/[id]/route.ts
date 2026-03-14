import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';
import { V3ReportResolver } from '@/lib/v3/reporting/reportResolver';
import { V3ReportingResolver } from '@/lib/v3/reporting/resolver';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v3/organizations/report/[id]
 * 
 * WHAT: Aggregates metrics and resolves report layout for a V3 organization.
 * WHY: Provides data for the Organization-level report page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 });
    }

    await connectV3();
    const organization = await V3Organization.findById(orgId).lean();
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // 1. Resolve report layout specifically for this organization
    const resolution = await V3ReportResolver.resolveForOrganization(orgId);
    if (!resolution) {
      return NextResponse.json({ success: false, error: 'Failed to resolve report layout' }, { status: 500 });
    }
    const { report, resolvedFrom, source } = resolution;

    // 2. Fetch all top-level entities (partners) belonging to the organization
    const entities = await V3Entity.find({ organizationId: orgId, parentEntityId: null })
      .select('name type status metadata')
      .sort({ name: 1 })
      .lean();

    // 3. Aggregate all metrics for the entire organization
    // V3ReportingResolver.aggregateMetric currently takes one metric at a time.
    // For the initial report view, we'll aggregate some common metrics if they exist in the metadata.
    // In a real scenario, we might want to aggregate all metrics that exist for this org.
    
    // For parity with Partner Report, we'll return an aggregatedStats object.
    const aggregatedStats: Record<string, number | string> = { ...(organization.metadata?.stats || {}) };

    // Note: In Phase 14, we don't yet have a list of V3 metrics to auto-aggregate everything.
    // This will be expanded as more V3 metrics are populated.

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        _id: organization._id.toString()
      },
      entities: entities.map(e => ({ ...e, _id: e._id.toString() })),
      report,
      resolvedFrom,
      source,
      aggregatedStats,
      totalEntities: entities.length
    });

  } catch (error: any) {
    console.error('❌ GET /api/v3/organizations/report/[id] failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
