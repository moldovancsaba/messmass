/**
 * Analytics API - Compare Periods Endpoint
 *
 * WHAT: Compares aggregated metrics between two time periods (e.g. month vs month)
 * WHY: Enable period-to-period analysis from aggregate analytics data
 *
 * GET /api/analytics/compare/periods
 * Query params:
 *   - periodA: Start of period A (YYYY-MM or YYYY-MM-DD)
 *   - periodB: Start of period B (same format as periodA)
 *   - bucket: 'daily' | 'weekly' | 'monthly' | 'yearly' (default: monthly)
 *   - partnerId: Optional partner filter
 *
 * Response: Aggregated metrics per period and deltas. Performance target: <500ms
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { requireSession } from '@/lib/apiGuards';

type TimeBucket = 'daily' | 'weekly' | 'monthly' | 'yearly';

function periodToRange(period: string, bucket: TimeBucket): { start: string; end: string } {
  const isMonth = /^\d{4}-\d{2}$/.test(period);
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(period);
  if (bucket === 'monthly' && isMonth) {
    const [y, m] = period.split('-').map(Number);
    const start = `${period}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    return { start, end: `${period}-${String(lastDay).padStart(2, '0')}` };
  }
  if (bucket === 'yearly' && /^\d{4}$/.test(period)) {
    return { start: `${period}-01-01`, end: `${period}-12-31` };
  }
  if (isDate) {
    return { start: period, end: period };
  }
  return { start: period, end: period };
}

export async function GET(request: NextRequest) {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  const startTime = Date.now();

  try {
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const periodA = searchParams.get('periodA');
    const periodB = searchParams.get('periodB');
    const bucket = (searchParams.get('bucket') as TimeBucket) || 'monthly';
    const partnerId = searchParams.get('partnerId') || undefined;

    if (!periodA || !periodB) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: periodA, periodB', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const rangeA = periodToRange(periodA, bucket);
    const rangeB = periodToRange(periodB, bucket);

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('analytics_aggregates');

    // WHAT: Query and read the per-event shape this collection actually stores.
    // WHY: This route filtered on `bucket` and `periodStart` and summed flat
    //     `totalAttendees` / `totalFans` fields — the TimeAggregatedMetrics shape,
    //     which nothing writes. Both period queries therefore returned zero rows and
    //     every comparison reported 0 vs 0 with a 200. The stored documents are
    //     per-event (`aggregationType`, `eventDate`, nested `fanMetrics` /
    //     `merchMetrics` / `bitlyMetrics` / `rawStats`), so both the filter and the
    //     metric extraction had to change, not just the filter.
    const queryBase: Record<string, unknown> = { aggregationType: bucket === 'monthly' || bucket === 'yearly' ? 'event' : 'event' };
    if (partnerId) queryBase['partnerContext.partnerId'] = new ObjectId(partnerId);

    const [docsA, docsB] = await Promise.all([
      collection.find({ ...queryBase, eventDate: { $gte: rangeA.start, $lte: rangeA.end } }).toArray(),
      collection.find({ ...queryBase, eventDate: { $gte: rangeB.start, $lte: rangeB.end } }).toArray(),
    ]);

    // WHAT: Read a nested metric path off a per-event aggregate.
    // WHY: The former flat keys have no equivalent at the top level; reading them
    //     produced 0 for every document even when documents matched.
    const at = (d: Record<string, any>, path: string): number => {
      const v = path.split('.').reduce<any>((acc, k) => (acc == null ? acc : acc[k]), d);
      return typeof v === 'number' && Number.isFinite(v) ? v : 0;
    };
    const sumPath = (arr: Array<Record<string, any>>, path: string) =>
      arr.reduce((acc, d) => acc + at(d, path), 0);
    const avgPath = (arr: Array<Record<string, any>>, path: string) =>
      arr.length ? sumPath(arr, path) / arr.length : 0;

    // Per-event equivalents of the metrics this endpoint reports. `eventCount` is
    // the document count, since one document is one event.
    const periodMetrics = (docs: Array<Record<string, any>>) => ({
      totalAttendees: sumPath(docs, 'rawStats.eventAttendees'),
      totalImages: sumPath(docs, 'rawStats.remoteImages') + sumPath(docs, 'rawStats.hostessImages'),
      totalFans: sumPath(docs, 'fanMetrics.totalFans'),
      totalMerchedFans: sumPath(docs, 'merchMetrics.totalMerched'),
      totalBitlyClicks: sumPath(docs, 'bitlyMetrics.clicks'),
      eventCount: docs.length,
      avgAttendees: avgPath(docs, 'rawStats.eventAttendees'),
      avgEngagementRate: avgPath(docs, 'fanMetrics.engagementRate'),
      merchandiseRate: avgPath(docs, 'merchMetrics.penetrationRate'),
    });

    const metricsA = periodMetrics(docsA);
    const metricsB = periodMetrics(docsB);

    // The `keys` list was removed with the flat-field summing; deltas are computed
    // over the metric names periodMetrics actually returns.
    const deltaKeys: Array<keyof ReturnType<typeof periodMetrics>> = [
      'totalAttendees', 'totalImages', 'totalFans', 'totalMerchedFans', 'totalBitlyClicks', 'eventCount',
    ];
    const deltas: Record<string, { absolute: number; percent: number }> = {};
    deltaKeys.forEach((k) => {
      const a = metricsA[k] ?? 0;
      const b = metricsB[k] ?? 0;
      deltas[k] = {
        absolute: b - a,
        percent: a !== 0 ? ((b - a) / a) * 100 : 0,
      };
    });
    deltas.avgAttendees = {
      absolute: metricsB.avgAttendees - metricsA.avgAttendees,
      percent: metricsA.avgAttendees !== 0 ? ((metricsB.avgAttendees - metricsA.avgAttendees) / metricsA.avgAttendees) * 100 : 0,
    };

    const queryTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: true,
        data: {
          periodA: { label: periodA, range: rangeA, metrics: metricsA, recordCount: docsA.length },
          periodB: { label: periodB, range: rangeB, metrics: metricsB, recordCount: docsB.length },
          deltas,
          bucket,
          partnerId: partnerId ?? null,
        },
        metadata: { queryTimeMs },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error) {
    console.error('Compare periods API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
