/**
 * Analytics API - Compare Partners Endpoint
 *
 * WHAT: Compares aggregated metrics between two or more partners
 * WHY: Enable partner-to-partner performance analysis (OPS-ANALYTICS-01 Phase 1)
 *
 * GET /api/analytics/compare/partners
 * Query params:
 *   - partnerIds: Comma-separated list of partner IDs (2-5 required)
 *   - metrics: Optional comma-separated metrics (default: totalAttendees, totalEvents, avgMerchandiseRate, totalBitlyClicks)
 *
 * Response: Partner metrics, rankings, and deltas. Performance target: <500ms
 *
 * Version: 11.55.1 (OPS-ANALYTICS-01 P1-2)
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';

const DEFAULT_METRICS = ['totalAttendees', 'totalEvents', 'avgMerchandiseRate', 'totalBitlyClicks'];
const MAX_PARTNERS = 5;
const MIN_PARTNERS = 2;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const partnerIdsParam = searchParams.get('partnerIds');
    const metricsParam = searchParams.get('metrics');

    if (!partnerIdsParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: partnerIds', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const partnerIds = partnerIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
    if (partnerIds.length < MIN_PARTNERS) {
      return NextResponse.json(
        { success: false, error: `At least ${MIN_PARTNERS} partner IDs required`, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }
    if (partnerIds.length > MAX_PARTNERS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_PARTNERS} partners can be compared at once`, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const requestedMetrics = metricsParam
      ? metricsParam.split(',').map((m) => m.trim()).filter(Boolean)
      : DEFAULT_METRICS;

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('partner_analytics');

    const docs = await collection.find({ partnerId: { $in: partnerIds } }).sort({ lastAggregatedAt: -1 }).toArray();

    // One doc per partner (if multiple timeframes, take latest)
    const byPartnerId = new Map<string, Record<string, unknown>>();
    for (const doc of docs) {
      const id = typeof doc.partnerId === 'string' ? doc.partnerId : doc.partnerId?.toString?.() ?? '';
      if (partnerIds.includes(id) && !byPartnerId.has(id)) {
        byPartnerId.set(id, doc as Record<string, unknown>);
      }
    }

    const missing = partnerIds.filter((id) => !byPartnerId.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Analytics not found for partner IDs: ${missing.join(', ')}`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const partners = partnerIds.map((id) => {
      const row = byPartnerId.get(id) as Record<string, unknown>;
      return {
        partnerId: id,
        partnerName: (row?.partnerName as string) ?? 'Unknown',
        partnerEmoji: row?.partnerEmoji as string | undefined,
        totalEvents: Number(row?.totalEvents ?? 0),
        totalAttendees: Number(row?.totalAttendees ?? 0),
        avgAttendeesPerEvent: Number(row?.avgAttendeesPerEvent ?? 0),
        totalImages: Number(row?.totalImages ?? 0),
        totalFans: Number(row?.totalFans ?? 0),
        totalMerchedFans: Number(row?.totalMerchedFans ?? 0),
        avgMerchandiseRate: Number(row?.avgMerchandiseRate ?? 0),
        totalBitlyClicks: Number(row?.totalBitlyClicks ?? 0),
        avgBitlyClicksPerEvent: Number(row?.avgBitlyClicksPerEvent ?? 0),
      };
    });

    const metricsToUse = requestedMetrics.filter((m) =>
      ['totalAttendees', 'totalEvents', 'avgAttendeesPerEvent', 'totalImages', 'totalFans', 'totalMerchedFans', 'avgMerchandiseRate', 'totalBitlyClicks', 'avgBitlyClicksPerEvent'].includes(m)
    );
    const rankings: Record<string, Array<{ partnerId: string; value: number }>> = {};
    metricsToUse.forEach((metric) => {
      const sorted = [...partners].sort((a, b) => (b[metric as keyof typeof partners[0]] as number) - (a[metric as keyof typeof partners[0]] as number));
      rankings[metric] = sorted.map((p) => ({ partnerId: p.partnerId, value: p[metric as keyof typeof p] as number }));
    });

    let deltas: Array<{ partnerId: string; comparedTo: string; metrics: Record<string, { absolute: number; percent: number }> }> = [];
    if (partners.length >= 2) {
      const baseline = partners[0];
      deltas = partners.slice(1).map((p) => {
        const metrics: Record<string, { absolute: number; percent: number }> = {};
        metricsToUse.forEach((metric) => {
          const b = (baseline[metric as keyof typeof baseline] as number) ?? 0;
          const v = (p[metric as keyof typeof p] as number) ?? 0;
          const absolute = v - b;
          const percent = b !== 0 ? (absolute / b) * 100 : 0;
          metrics[metric] = { absolute, percent };
        });
        return { partnerId: p.partnerId, comparedTo: baseline.partnerId, metrics };
      });
    }

    const queryTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: true,
        data: {
          partners,
          metrics: metricsToUse,
          rankings,
          deltas,
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
    console.error('Compare partners API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
