// app/api/analytics/insights/combined/route.ts
// WHAT: Merges insights from both pipelines -- lib/insightsEngine.ts
//     (Executive Dashboard) and lib/analytics-insights.ts (partner/org
//     Analytics Insights) -- into one list via lib/combinedInsight.ts.
// WHY: messmass#414 follow-up. The two pipelines duplicate the same practical
//     purpose (surface issues in recent events) with different statistics and
//     wrapper types; this is the first real consumer of the lossless merge,
//     for a new standalone page rather than touching either live dashboard.
// HOW: Reuses each pipeline's own generation function (generateEventInsights,
//     generateInsights) exactly as their existing routes do -- this route
//     duplicates only the "fetch recent events, loop" plumbing already
//     visible in both source routes, not their actual detection logic.

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireSession } from '@/lib/apiGuards';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { error as logError } from '@/lib/logger';
import { generateEventInsights } from '@/lib/insightsEngine';
import { generateInsights } from '@/lib/analytics-insights';
import { fromExecutiveInsight, fromAnalyticsInsight, combinedInsightRank, type CombinedInsight } from '@/lib/combinedInsight';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

export async function GET(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  try {
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) return rateLimitResult;

    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 1), 50);

    const client = await clientPromise;
    const db = client.db(config.dbName);

    const combined: CombinedInsight[] = [];

    // Executive pipeline: same recent-aggregates + per-partner-history pattern
    // as GET /api/analytics/executive/insights.
    const recentAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({ 'partnerContext.partnerId': { $exists: true } })
      .sort({ eventDate: -1 })
      .limit(limit)
      .toArray();

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
        for (const insight of report.insights) {
          combined.push(fromExecutiveInsight(insight, aggregate.eventDate));
        }
      } catch (e) {
        logError('Executive insight generation failed for one event (combined feed)', { projectId: aggregate.projectId }, e instanceof Error ? e : new Error(String(e)));
      }
    }

    // Analytics pipeline: same recent-events loop as GET /api/analytics/insights.
    const recentEvents = await db.collection('projects').find({}).sort({ eventDate: -1 }).limit(limit).toArray();

    for (const event of recentEvents) {
      try {
        const report = await generateInsights(event._id.toString());
        if (!report) continue;
        for (const insight of report.insights) {
          combined.push(fromAnalyticsInsight(insight));
        }
      } catch (e) {
        logError('Analytics insight generation failed for one event (combined feed)', { eventId: event._id.toString() }, e instanceof Error ? e : new Error(String(e)));
      }
    }

    combined.sort((a, b) => combinedInsightRank(b) - combinedInsightRank(a) || b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      data: {
        insights: combined,
        summary: {
          total: combined.length,
          fromExecutive: combined.filter((i) => i.source === 'executive').length,
          fromAnalytics: combined.filter((i) => i.source === 'analytics').length,
        },
      },
    });
  } catch (error) {
    logError('Combined insights feed failed', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to generate combined insights' }, { status: 500 });
  }
}
