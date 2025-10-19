/**
 * GET /api/analytics/executive/top-events
 * 
 * WHAT: Top performing events ranked by combined performance score
 * WHY: Showcase best events for executive recognition and benchmark setting
 * HOW: Query analytics_aggregates, calculate composite score, rank and limit
 * 
 * Query Parameters:
 * - period: '30d' | '90d' | 'all' (default: '30d')
 * - limit: number (default: 5, max: 20)
 * - sortBy: 'fans' | 'revenue' | 'engagement' | 'composite' (default: 'composite')
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: string,
 *       name: string,
 *       date: string,
 *       fans: number,
 *       revenue: number,
 *       engagement: number,
 *       score: number // Composite performance score
 *     }
 *   ]
 * }
 * 
 * Performance Target: <150ms
 * Version: 6.32.0 (Phase 3 - Executive Dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { info as logInfo, error as logError } from '@/lib/logger';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

interface TopEvent {
  id: string;
  name: string;
  date: string;
  fans: number;
  revenue: number;
  engagement: number;
  score: number;
}

type SortBy = 'fans' | 'revenue' | 'engagement' | 'composite';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // WHAT: Rate limiting for executive endpoints
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30d';
    const limitParam = parseInt(searchParams.get('limit') || '5', 10);
    const sortBy = (searchParams.get('sortBy') || 'composite') as SortBy;

    // WHAT: Validate and constrain parameters
    const limit = Math.min(Math.max(limitParam, 1), 20);
    const period = periodParam === '90d' ? 90 : periodParam === 'all' ? null : 30;

    const client = await clientPromise;
    const db = client.db();

    // WHAT: Build query filter based on period
    const query: any = {};
    if (period !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period);
      query.eventDate = { $gte: cutoffDate.toISOString() };
    }

    // WHAT: Fetch aggregates for the period
    // WHY: Need all metrics to calculate composite scores
    const aggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find(query)
      .toArray();

    if (aggregates.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // WHAT: Transform aggregates to top events with scores
    const events: TopEvent[] = aggregates.map((agg) => {
      const fans = agg.fanMetrics?.totalFans || 0;
      const revenue = agg.adMetrics?.totalROI || 0; // Ad value as primary revenue metric
      const engagement = agg.fanMetrics?.engagementRate || 0;

      // WHAT: Calculate composite score (weighted average)
      // WHY: Balance multiple success factors for fair ranking
      // Formula: (fans/100) + (revenue/10) + (engagement*10)
      // This gives roughly equal weight to: 10k fans ~ €1k revenue ~ 10% engagement
      const score = (fans / 100) + (revenue / 10) + (engagement * 10);

      return {
        id: agg.projectId.toString(),
        name: agg.partnerContext?.partnerName || 'Unknown Event',
        date: agg.eventDate,
        fans,
        revenue: Math.round(revenue),
        engagement: Math.round(engagement * 10) / 10,
        score: Math.round(score)
      };
    });

    // WHAT: Sort events by selected metric
    // WHY: Allow flexible ranking based on different KPIs
    events.sort((a, b) => {
      switch (sortBy) {
        case 'fans':
          return b.fans - a.fans;
        case 'revenue':
          return b.revenue - a.revenue;
        case 'engagement':
          return b.engagement - a.engagement;
        case 'composite':
        default:
          return b.score - a.score;
      }
    });

    // WHAT: Limit to top N events
    const topEvents = events.slice(0, limit);

    const duration = Date.now() - startTime;
    logInfo('Top events calculated', {
      period: periodParam,
      sortBy,
      limit,
      totalEvents: aggregates.length,
      topEventsReturned: topEvents.length,
      duration
    });

    return NextResponse.json({
      success: true,
      data: topEvents
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Top events calculation failed', {
      error: err.message,
      stack: err.stack,
      duration
    }, err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate top events'
      },
      { status: 500 }
    );
  }
}
