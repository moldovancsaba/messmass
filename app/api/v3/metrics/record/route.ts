import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3MetricValue from '@/lib/models/v3/MetricValue';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import { withRateLimit, RATE_LIMIT_POLICIES } from '@/lib/middleware/rateLimit';

/**
 * POST /api/v3/metrics/record
 * 
 * Bulk records metric values for an organization.
 * Expects an array of data points.
 */
async function recordMetrics(req: Request) {
  try {
    const { dataPoints } = await req.json();
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      return NextResponse.json({ error: 'dataPoints array is required' }, { status: 400 });
    }

    // Map organizationId and validated timestamp
    const documents = dataPoints.map(dp => ({
      ...dp,
      organizationId: orgId,
      timestamp: dp.timestamp ? new Date(dp.timestamp) : new Date(),
    }));

    // Use insertMany for high-performance bulk write
    const result = await V3MetricValue.insertMany(documents, { ordered: false });

    return NextResponse.json({ 
      message: 'Metrics recorded successfully', 
      insertedCount: result.length 
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Bulk Ingestion Failed:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

// Wrap with Rate Limiting first, then Organization Context Middleware
export const POST = (req: Request) =>
  withRateLimit(req, RATE_LIMIT_POLICIES.API, () => withOrgContext(req, recordMetrics));
