import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectV3 from '@/lib/mongoose-v3';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import MetricValue from '@/lib/models/v3/MetricValue';

/**
 * GET /api/v3/reporting/export/[entityId]
 * 
 * WHAT: Export aggregated metrics as a downloadable CSV
 * WHY: Customer-facing export of V3 quantitative data
 * HOW: Aggregates v3_metric_values on the fly for consistency
 */
async function exportMetricsAsCsv(req: Request, context: any) {
  try {
    const { entityId } = await context.params;
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    // Aggregate values for this entity
    const aggregatedMetrics = await MetricValue.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(orgId as string),
          entityId: new mongoose.Types.ObjectId(entityId)
        }
      },
      {
        $group: {
          _id: "$metricKey",
          total: { $sum: "$value" },
          count: { $sum: 1 },
          minDate: { $min: "$timestamp" },
          maxDate: { $max: "$timestamp" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (!aggregatedMetrics || aggregatedMetrics.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No data found for the specified entity.' 
      }, { status: 404 });
    }

    // Convert to CSV
    const headers = ['Metric Key', 'Total Value', 'Record Count', 'First Seen', 'Last Seen'];
    const csvRows = [headers.join(',')];

    aggregatedMetrics.forEach(metric => {
      const row = [
        `"${String(metric._id).replace(/"/g, '""')}"`,
        metric.total,
        metric.count,
        metric.minDate ? metric.minDate.toISOString() : '',
        metric.maxDate ? metric.maxDate.toISOString() : ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="v3_export_${entityId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error(`❌ Export Failed:`, error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

export const GET = (req: Request, context: any) => withOrgContext(req, (r) => exportMetricsAsCsv(r, context));
