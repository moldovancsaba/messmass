import { NextResponse } from 'next/server';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import { V3ReportingResolver } from '@/lib/v3/reporting/resolver';

/**
 * GET /api/v3/reporting/dashboard
 * 
 * Returns aggregated metrics for a specific entity hierarchy.
 * Query Params:
 *  - entityId: string (required)
 *  - metrics: string (comma-separated metric keys, e.g. "sales,attendance")
 *  - startDate: string (ISO)
 *  - endDate: string (ISO)
 */
async function getDashboard(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = req.headers.get('x-v3-org-id') as string;
    const entityId = searchParams.get('entityId');
    const metricsParam = searchParams.get('metrics');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!entityId || !metricsParam) {
      return NextResponse.json({ 
        error: 'entityId and metrics are required' 
      }, { status: 400 });
    }

    const metricKeys = metricsParam.split(',').map(k => k.trim());
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const results = await Promise.all(
      metricKeys.map(key => 
        V3ReportingResolver.aggregateMetric(orgId, entityId, key, options)
      )
    );

    return NextResponse.json({
      entityId,
      timestamp: new Date().toISOString(),
      metrics: results,
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ GET /api/v3/reporting/dashboard failed:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

// Wrap with Organization Context Middleware
export const GET = (req: Request) => withOrgContext(req, getDashboard);
