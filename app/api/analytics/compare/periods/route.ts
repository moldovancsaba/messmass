/**
 * Analytics API - Compare Periods Endpoint
 *
 * WHAT: Compares aggregated metrics between two time periods (e.g. month vs month)
 * WHY: Enable period-to-period analysis (OPS-ANALYTICS-01 Phase 1)
 *
 * GET /api/analytics/compare/periods
 * Query params:
 *   - periodA: Start of period A (YYYY-MM or YYYY-MM-DD)
 *   - periodB: Start of period B (same format as periodA)
 *   - bucket: 'daily' | 'weekly' | 'monthly' | 'yearly' (default: monthly)
 *   - partnerId: Optional partner filter
 *
 * Response: Aggregated metrics per period and deltas. Performance target: <500ms
 *
 * Version: 11.55.1 (OPS-ANALYTICS-01 P1-3)
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';

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

    const queryBase: Record<string, unknown> = { bucket };
    if (partnerId) queryBase.partnerId = partnerId;

    const [docsA, docsB] = await Promise.all([
      collection.find({ ...queryBase, periodStart: { $gte: rangeA.start, $lte: rangeA.end } }).toArray(),
      collection.find({ ...queryBase, periodStart: { $gte: rangeB.start, $lte: rangeB.end } }).toArray(),
    ]);

    const sum = (arr: Array<Record<string, unknown>>, key: string) =>
      arr.reduce((acc, d) => acc + (Number(d[key]) ?? 0), 0);
    const avg = (arr: Array<Record<string, unknown>>, key: string) =>
      arr.length ? sum(arr, key) / arr.length : 0;

    const keys = ['totalAttendees', 'totalImages', 'totalFans', 'totalMerchedFans', 'totalBitlyClicks', 'eventCount'];
    const periodMetrics = (docs: Array<Record<string, unknown>>) => {
      const out: Record<string, number> = {};
      keys.forEach((k) => {
        out[k] = k === 'eventCount' ? sum(docs, k) : sum(docs, k);
      });
      out.avgAttendees = docs.length ? avg(docs, 'totalAttendees') : 0;
      out.avgEngagementRate = docs.length ? avg(docs, 'avgEngagementRate') : 0;
      out.merchandiseRate = docs.length ? avg(docs, 'merchandiseRate') : 0;
      return out;
    };

    const metricsA = periodMetrics(docsA);
    const metricsB = periodMetrics(docsB);

    const deltas: Record<string, { absolute: number; percent: number }> = {};
    keys.forEach((k) => {
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
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
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
