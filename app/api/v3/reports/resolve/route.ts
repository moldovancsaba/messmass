import { NextResponse } from 'next/server';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import { V3ReportResolver } from '@/lib/v3/reporting/reportResolver';

/**
 * GET /api/v3/reports/resolve
 * 
 * WHAT: Resolves the appropriate report template for a V3 Activity or Entity
 * HOW: ?activityId=[id] OR ?entityId=[id]
 * SCOPE: Organization-restricted
 */
async function resolveV3Report(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = req.headers.get('x-v3-org-id') as string;
    const activityId = searchParams.get('activityId');
    const entityId = searchParams.get('entityId');

    if (activityId) {
      const result = await V3ReportResolver.resolveForActivity(activityId, orgId);
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    }

    if (entityId) {
      const result = await V3ReportResolver.resolveForEntity(entityId, orgId);
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Either activityId or entityId is required' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ GET /api/v3/reports/resolve failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

// Wrap with Organization Context
export const GET = (req: Request) => withOrgContext(req, resolveV3Report);
