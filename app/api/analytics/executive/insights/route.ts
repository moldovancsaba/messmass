/**
 * GET /api/analytics/executive/insights
 * 
 * WHAT: Aggregated critical insights across multiple events
 * WHY: Surface most important insights for executive action and attention
 * HOW: Query recent events, generate insights, filter by priority, limit to top N
 * 
 * Query Parameters:
 * - priority: 'critical' | 'high' | 'critical,high' (default: 'critical,high')
 * - limit: number (default: 5, max: 20)
 * - period: '7d' | '30d' | '90d' (default: '30d')
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     insights: Insight[],
 *     summary: {
 *       totalInsights: number,
 *       criticalCount: number,
 *       highCount: number,
 *       eventsAnalyzed: number
 *     }
 *   }
 * }
 * 
 * Performance Target: <500ms (generates insights on-the-fly)
 * Version: 6.32.0 (Phase 3 - Executive Dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { info as logInfo, error as logError } from '@/lib/logger';
import { generateEventInsights } from '@/lib/insightsEngine';
import type { AnalyticsAggregate } from '@/lib/analytics.types';
import type { Insight } from '@/lib/insightsEngine';

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
    const priorityParam = searchParams.get('priority') || 'critical,high';
    const limitParam = parseInt(searchParams.get('limit') || '5', 10);
    const periodParam = searchParams.get('period') || '30d';

    // WHAT: Validate and constrain parameters
    const limit = Math.min(Math.max(limitParam, 1), 20);
    const priorities = priorityParam.split(',') as ('critical' | 'high' | 'medium' | 'low')[];
    const period = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30;

    const client = await clientPromise;
    const db = client.db();

    // WHAT: Calculate date range for recent events
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    // WHAT: Fetch recent event aggregates with partner context
    // WHY: Need partner context for insights generation
    const recentAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({
        eventDate: { $gte: cutoffDate.toISOString() },
        'partnerContext.partnerId': { $exists: true }
      })
      .sort({ eventDate: -1 })
      .limit(50) // Analyze up to 50 most recent events
      .toArray();

    if (recentAggregates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          insights: [],
          summary: {
            totalInsights: 0,
            criticalCount: 0,
            highCount: 0,
            eventsAnalyzed: 0
          }
        }
      });
    }

    // WHAT: Generate insights for each recent event
    // WHY: Capture all critical issues across multiple events
    const allInsights: (Insight & { eventName: string; eventDate: string })[] = [];

    for (const aggregate of recentAggregates) {
      try {
        // WHAT: Get historical data for this partner
        const historicalAggregates = await db
          .collection<AnalyticsAggregate>('analytics_aggregates')
          .find({
            'partnerContext.partnerId': aggregate.partnerContext?.partnerId,
            eventDate: { $lt: aggregate.eventDate },
            _id: { $ne: aggregate._id }
          })
          .sort({ eventDate: -1 })
          .limit(10) // Last 10 events for context
          .toArray();

        // WHAT: Generate insights for this event
        const insightsReport = generateEventInsights(aggregate, historicalAggregates);

        // WHAT: Add event context to each insight
        // WHY: Executives need to know which event the insight is about
        const contextualizedInsights = insightsReport.insights.map(insight => ({
          ...insight,
          eventName: aggregate.partnerContext?.partnerName || 'Unknown Event',
          eventDate: aggregate.eventDate
        }));

        allInsights.push(...contextualizedInsights);
      } catch (error) {
        // WHAT: Log error but continue processing other events
        // WHY: One failing event shouldn't block entire dashboard
        console.error(`Failed to generate insights for event ${aggregate.projectId}:`, error);
      }
    }

    // WHAT: Filter insights by priority
    // WHY: Only show critical and high priority items to executives
    const filteredInsights = allInsights.filter(insight => 
      priorities.includes(insight.priority)
    );

    // WHAT: Sort by priority (critical first) and confidence (high first)
    // WHY: Most important and reliable insights first
    filteredInsights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence; // Tie-break with confidence
    });

    // WHAT: Limit to top N insights
    const topInsights = filteredInsights.slice(0, limit);

    // WHAT: Calculate summary statistics
    const summary = {
      totalInsights: topInsights.length,
      criticalCount: topInsights.filter(i => i.priority === 'critical').length,
      highCount: topInsights.filter(i => i.priority === 'high').length,
      eventsAnalyzed: recentAggregates.length
    };

    const duration = Date.now() - startTime;
    logInfo('Executive insights calculated', {
      period,
      priorities,
      limit,
      eventsAnalyzed: recentAggregates.length,
      insightsGenerated: allInsights.length,
      insightsReturned: topInsights.length,
      duration
    });

    return NextResponse.json({
      success: true,
      data: {
        insights: topInsights,
        summary
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Executive insights calculation failed', {
      error: err.message,
      stack: err.stack,
      duration
    }, err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate executive insights'
      },
      { status: 500 }
    );
  }
}
