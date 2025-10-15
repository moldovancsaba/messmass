/**
 * Analytics Insights API - Main Route
 * 
 * WHAT: REST API for fetching global insights across all events
 * WHY: Provide insights overview with filtering capabilities
 * 
 * Endpoint: GET /api/analytics/insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { generateInsights, Insight } from '@/lib/analytics-insights';

/**
 * GET /api/analytics/insights
 * 
 * WHAT: Fetch global insights across recent events
 * WHY: Dashboard view of all insights with filtering
 * 
 * Query Parameters:
 * - type: Filter by insight type (anomaly, trend, benchmark, prediction, recommendation)
 * - severity: Filter by severity (info, warning, critical)
 * - limit: Number of events to analyze (default: 10)
 * - since: ISO date - only events after this date
 */
export async function GET(request: NextRequest) {
  try {
    // WHAT: Admin authentication required
    // WHY: Insights contain sensitive business intelligence
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    // WHAT: Parse query parameters
    // WHY: Support flexible filtering of insights
    const type = searchParams.get('type') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const since = searchParams.get('since') || undefined;

    // WHAT: Validate parameters
    // WHY: Prevent invalid queries
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    const validTypes = ['anomaly', 'trend', 'benchmark', 'prediction', 'recommendation'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validSeverities = ['info', 'warning', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // WHAT: Fetch recent events
    // WHY: Generate insights for latest events
    const client = await clientPromise;
    const db = client.db(config.dbName);

    const query: any = {};
    if (since) {
      query.eventDate = { $gte: since };
    }

    const events = await db
      .collection('projects')
      .find(query)
      .sort({ eventDate: -1 })
      .limit(limit)
      .toArray();

    if (events.length === 0) {
      return NextResponse.json({
        insights: [],
        metadata: {
          totalInsights: 0,
          anomalies: 0,
          trends: 0,
          benchmarks: 0,
          predictions: 0,
          recommendations: 0,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // WHAT: Generate insights for all events
    // WHY: Collect comprehensive insights dataset
    const allInsightsPromises = events.map((event) =>
      generateInsights(event._id.toString()).catch((error) => {
        console.error(`Failed to generate insights for event ${event._id}:`, error);
        return null;
      })
    );

    const insightsReports = (await Promise.all(allInsightsPromises)).filter(
      (report): report is NonNullable<typeof report> => report !== null
    );

    // WHAT: Flatten all insights into single array
    // WHY: Easier to filter and sort globally
    let allInsights: Insight[] = [];
    insightsReports.forEach((report) => {
      allInsights.push(...report.insights);
    });

    // WHAT: Apply filters
    // WHY: Return only insights matching criteria
    if (type) {
      allInsights = allInsights.filter((insight) => insight.type === type);
    }

    if (severity) {
      allInsights = allInsights.filter((insight) => insight.severity === severity);
    }

    // WHAT: Sort by severity and confidence
    // WHY: Most important insights first
    allInsights.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.confidence - a.confidence;
    });

    // WHAT: Calculate metadata
    // WHY: Provide summary statistics
    const metadata = {
      totalInsights: allInsights.length,
      anomalies: allInsights.filter((i) => i.type === 'anomaly').length,
      trends: allInsights.filter((i) => i.type === 'trend').length,
      benchmarks: allInsights.filter((i) => i.type === 'benchmark').length,
      predictions: allInsights.filter((i) => i.type === 'prediction').length,
      recommendations: allInsights.filter((i) => i.type === 'recommendation').length,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      insights: allInsights,
      metadata,
    });
  } catch (error) {
    console.error('Error fetching global insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: (error as Error).message },
      { status: 500 }
    );
  }
}
