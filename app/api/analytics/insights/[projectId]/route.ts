/**
 * GET /api/analytics/insights/[projectId]
 * 
 * WHY: Generates auto-generated, actionable insights for a specific event.
 * WHAT: Combines anomaly detection, trend analysis, and benchmarking to produce
 *       5-10 prioritized insights with natural language explanations.
 * 
 * Query Parameters:
 * - includeRecommendations (default: true) - Include action recommendations
 * - severity (optional) - Filter by severity: 'critical' | 'warning' | 'info'
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     projectId: string,
 *     eventName: string,
 *     eventDate: string,
 *     generatedAt: string (ISO 8601),
 *     summary: {
 *       totalInsights: number,
 *       criticalCount: number,
 *       warningCount: number,
 *       infoCount: number
 *     },
 *     insights: Insight[],
 *     context: {
 *       historicalEventsAnalyzed: number,
 *       benchmarkEventsAnalyzed: number
 *     }
 *   }
 * }
 * 
 * Performance Target: <300ms
 * Version: 6.26.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { generateEventInsights } from '@/lib/insightsEngine';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { info as logInfo, error as logError } from '@/lib/logger';
import type { AnalyticsAggregate } from '@/lib/analytics.types';
import type { Insight } from '@/lib/insightsEngine';

// WHY: Type-safe response structure for insights API
interface InsightsResponse {
  success: boolean;
  data?: {
    projectId: string;
    eventName: string;
    eventDate: string;
    generatedAt: string;
    summary: {
      totalInsights: number;
      criticalCount: number;
      warningCount: number;
      infoCount: number;
    };
    insights: Insight[];
    context: {
      historicalEventsAnalyzed: number;
      benchmarkEventsAnalyzed: number;
    };
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
): Promise<NextResponse<InsightsResponse>> {
  const startTime = Date.now();

  try {
    // WHY: Rate limiting prevents abuse of computationally expensive insights generation
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      // Rate limit exceeded, middleware returned error response
      return rateLimitResult as NextResponse<InsightsResponse>;
    }

    // WHY: Next.js 15 requires awaiting dynamic params
    const { projectId } = await params;

    // WHY: Validate ObjectId format before MongoDB query
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      );
    }

    // WHY: Parse query parameters for filtering and feature flags
    const { searchParams } = new URL(request.url);
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';
    const severityFilter = searchParams.get('severity') as 'critical' | 'warning' | 'info' | null;

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // WHY: Fetch current event's pre-computed analytics from aggregates collection
    const currentAggregate = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .findOne({ projectId: new ObjectId(projectId) });

    if (!currentAggregate) {
      return NextResponse.json(
        { success: false, error: 'Event not found or analytics not yet aggregated' },
        { status: 404 }
      );
    }

    // WHY: Extract partner context to fetch historical data for trend analysis
    const { partnerContext } = currentAggregate;
    if (!partnerContext?.partnerId) {
      return NextResponse.json(
        { success: false, error: 'Event missing partner context required for insights' },
        { status: 400 }
      );
    }

    // WHY: Fetch historical events for the same partner to establish trends and baselines
    // WHAT: Sort by event date descending, limit to last 12 months for performance
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const historicalAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({
        'partnerContext.partnerId': partnerContext.partnerId,
        eventDate: { $gte: twelveMonthsAgo.toISOString(), $lt: currentAggregate.eventDate },
        _id: { $ne: currentAggregate._id } // Exclude current event
      })
      .sort({ eventDate: -1 })
      .limit(50) // WHY: 50 events provides sufficient trend data without performance penalty
      .toArray();

    // WHY: Fetch league-wide benchmarks for percentile comparisons
    // WHAT: Use all events from last 6 months for robust benchmark statistics
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const benchmarkAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({
        eventDate: { $gte: sixMonthsAgo.toISOString() },
        _id: { $ne: currentAggregate._id } // Exclude current event
      })
      .limit(500) // WHY: 500 events provides statistically significant benchmark pool
      .toArray();

    // WHY: Generate insights using the centralized insights engine
    // WHAT: Engine combines anomaly detection, trend analysis, and benchmarking
    const insightsReport = generateEventInsights(
      currentAggregate,
      historicalAggregates
    );
    
    const insights = insightsReport.insights;

    // WHY: Filter insights by priority (not severity) if requested
    const filteredInsights = severityFilter
      ? insights.filter((i: Insight) => i.priority === severityFilter)
      : insights;
    
    // WHY: Calculate summary statistics for quick dashboard overview
    const summary = {
      totalInsights: filteredInsights.length,
      criticalCount: filteredInsights.filter((i: Insight) => i.priority === 'critical').length,
      warningCount: filteredInsights.filter((i: Insight) => i.priority === 'high').length,
      infoCount: filteredInsights.filter((i: Insight) => i.priority === 'medium').length
    };
    
    // WHY: Remove recommendation if client doesn't need it (reduces payload size)
    const responseInsights: Insight[] = includeRecommendations
      ? filteredInsights
      : filteredInsights.map(({ recommendation, ...rest }: Insight) => rest as Insight);

    const duration = Date.now() - startTime;
    logInfo('Insights generated', {
      projectId,
      insightCount: filteredInsights.length,
      duration,
      historicalEvents: historicalAggregates.length,
      benchmarkEvents: benchmarkAggregates.length
    });

    return NextResponse.json({
      success: true,
      data: {
        projectId: projectId,
        eventName: partnerContext.partnerName || 'Unknown Event',
        eventDate: currentAggregate.eventDate,
        generatedAt: new Date().toISOString(),
        summary,
        insights: responseInsights,
        context: {
          historicalEventsAnalyzed: historicalAggregates.length,
          benchmarkEventsAnalyzed: benchmarkAggregates.length
        }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Insights generation failed', {
      error: err.message,
      stack: err.stack,
      duration
    }, err);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate insights'
      },
      { status: 500 }
    );
  }
}
