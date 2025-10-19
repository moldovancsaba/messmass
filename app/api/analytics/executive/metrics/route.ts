/**
 * GET /api/analytics/executive/metrics
 * 
 * WHAT: Executive-level KPI aggregation across all events
 * WHY: Provide high-level metrics for stakeholder dashboard with period comparison
 * HOW: Query analytics_aggregates, sum metrics, calculate growth vs previous period
 * 
 * Query Parameters:
 * - period: '30d' | '90d' (default: '30d')
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     totalFans: number,
 *     totalRevenue: number,
 *     totalROI: number,
 *     avgEngagement: number,
 *     eventCount: number,
 *     growth: number, // Percent growth vs previous period
 *     previousPeriod: {
 *       totalFans: number,
 *       totalRevenue: number,
 *       totalROI: number,
 *       avgEngagement: number,
 *       eventCount: number
 *     }
 *   }
 * }
 * 
 * Performance Target: <200ms
 * Version: 6.32.0 (Phase 3 - Executive Dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { info as logInfo, error as logError } from '@/lib/logger';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

interface ExecutiveMetrics {
  totalFans: number;
  totalRevenue: number;
  totalROI: number;
  avgEngagement: number;
  eventCount: number;
  growth: number;
  previousPeriod: {
    totalFans: number;
    totalRevenue: number;
    totalROI: number;
    avgEngagement: number;
    eventCount: number;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // WHAT: Rate limiting for executive endpoints
    // WHY: Protect against dashboard abuse while allowing frequent refreshes
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // WHAT: Parse period parameter (30d or 90d)
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30d';
    const period = periodParam === '90d' ? 90 : 30;

    const client = await clientPromise;
    const db = client.db();

    // WHAT: Calculate date ranges for current and previous periods
    // WHY: Enable period-over-period comparison for growth metrics
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - period);
    
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - period);
    const previousEnd = new Date(currentStart);

    // WHAT: Query current period aggregates
    // WHY: Get all events within the selected time window
    const currentAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({
        eventDate: {
          $gte: currentStart.toISOString(),
          $lt: now.toISOString()
        }
      })
      .toArray();

    // WHAT: Query previous period aggregates for comparison
    // WHY: Calculate growth percentage and period-over-period changes
    const previousAggregates = await db
      .collection<AnalyticsAggregate>('analytics_aggregates')
      .find({
        eventDate: {
          $gte: previousStart.toISOString(),
          $lt: previousEnd.toISOString()
        }
      })
      .toArray();

    // WHAT: Calculate current period metrics
    const currentMetrics = calculatePeriodMetrics(currentAggregates);
    const previousMetrics = calculatePeriodMetrics(previousAggregates);

    // WHAT: Calculate growth percentage (fans-based)
    // WHY: Primary indicator of business growth
    const growth = previousMetrics.totalFans > 0
      ? ((currentMetrics.totalFans - previousMetrics.totalFans) / previousMetrics.totalFans) * 100
      : 0;

    const response: ExecutiveMetrics = {
      ...currentMetrics,
      growth: Math.round(growth * 10) / 10, // Round to 1 decimal
      previousPeriod: previousMetrics
    };

    const duration = Date.now() - startTime;
    logInfo('Executive metrics calculated', {
      period,
      currentEvents: currentAggregates.length,
      previousEvents: previousAggregates.length,
      growth,
      duration
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Executive metrics calculation failed', {
      error: err.message,
      stack: err.stack,
      duration
    }, err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate executive metrics'
      },
      { status: 500 }
    );
  }
}

/**
 * WHAT: Calculate aggregated metrics from a set of analytics aggregates
 * WHY: Reusable function for current and previous period calculations
 * HOW: Sum fans, revenue, ROI; average engagement; count events
 */
function calculatePeriodMetrics(aggregates: AnalyticsAggregate[]): Omit<ExecutiveMetrics, 'growth' | 'previousPeriod'> {
  if (aggregates.length === 0) {
    return {
      totalFans: 0,
      totalRevenue: 0,
      totalROI: 0,
      avgEngagement: 0,
      eventCount: 0
    };
  }

  // WHAT: Sum total fans across all events
  const totalFans = aggregates.reduce((sum, agg) => sum + (agg.fanMetrics?.totalFans || 0), 0);

  // WHAT: Sum total revenue (ad value from all sources)
  // WHY: Revenue = social value + email value + stadium ad exposure
  const totalRevenue = aggregates.reduce((sum, agg) => {
    const adValue = (agg.adMetrics?.totalROI || 0);
    return sum + adValue;
  }, 0);

  // WHAT: Sum total ROI (ad value from all sources)
  const totalROI = aggregates.reduce((sum, agg) => sum + (agg.adMetrics?.totalROI || 0), 0);

  // WHAT: Calculate average engagement rate across events
  // WHY: Engagement = (total images / total fans) * 100
  const avgEngagement = aggregates.reduce((sum, agg) => sum + (agg.fanMetrics?.engagementRate || 0), 0) / aggregates.length;

  const eventCount = aggregates.length;

  return {
    totalFans: Math.round(totalFans),
    totalRevenue: Math.round(totalRevenue),
    totalROI: Math.round(totalROI),
    avgEngagement: Math.round(avgEngagement * 10) / 10, // Round to 1 decimal
    eventCount
  };
}
