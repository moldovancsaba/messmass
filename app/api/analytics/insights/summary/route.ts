/**
 * Analytics Insights Summary API
 *
 * WHAT: Lightweight summary of insight counts (by priority and category) for dashboards
 * WHY: Phase 2 — allow UI to show "5 critical, 12 high" without loading full insight bodies
 *
 * GET /api/analytics/insights/summary
 * Query params:
 *   - partnerId: Optional — filter to partner's events
 *   - period: '7d' | '30d' | '90d' (default: 30d)
 *   - maxEvents: Max events to analyze (default: 50, max: 100)
 *
 * Response: Counts only (no insight bodies). Performance target: <500ms
 * Version: 11.55.1 (OPS-ANALYTICS-01 Phase 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { generateEventInsights } from '@/lib/insightsEngine';
import type { AnalyticsAggregate } from '@/lib/analytics.types';
import type { Insight } from '@/lib/insightsEngine';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || undefined;
    const periodParam = searchParams.get('period') || '30d';
    const maxEvents = Math.min(Math.max(parseInt(searchParams.get('maxEvents') || '50', 10), 1), 100);

    const period = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    const client = await clientPromise;
    const db = client.db(config.dbName);

    const query: Record<string, unknown> = {
      eventDate: { $gte: cutoffDate.toISOString() },
      'partnerContext.partnerId': { $exists: true },
    };
    if (partnerId) {
      if (!ObjectId.isValid(partnerId)) {
        return NextResponse.json({ error: 'Invalid partner ID format' }, { status: 400 });
      }
      query['partnerContext.partnerId'] = new ObjectId(partnerId);
    }

    const recentAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find(query)
      .sort({ eventDate: -1 })
      .limit(maxEvents)
      .toArray();

    const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    const byCategory: Record<string, number> = {};

    for (const aggregate of recentAggregates) {
      try {
        const historicalAggregates = await db
          .collection<AnalyticsAggregate>('analytics_aggregates')
          .find({
            'partnerContext.partnerId': aggregate.partnerContext?.partnerId,
            eventDate: { $lt: aggregate.eventDate },
            _id: { $ne: aggregate._id },
          })
          .sort({ eventDate: -1 })
          .limit(10)
          .toArray();

        const report = generateEventInsights(aggregate, historicalAggregates);
        report.insights.forEach((i: Insight) => {
          byPriority[i.priority] = (byPriority[i.priority] ?? 0) + 1;
          byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
        });
      } catch {
        // skip single-event failures
      }
    }

    const totalInsights = Object.values(byPriority).reduce((a, b) => a + b, 0);
    const queryTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        totalInsights,
        criticalCount: byPriority.critical,
        highCount: byPriority.high,
        mediumCount: byPriority.medium,
        lowCount: byPriority.low,
        byCategory,
        eventsAnalyzed: recentAggregates.length,
        period: `${period}d`,
        partnerId: partnerId ?? null,
      },
      metadata: { queryTimeMs },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Insights summary API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights summary' },
      { status: 500 }
    );
  }
}
