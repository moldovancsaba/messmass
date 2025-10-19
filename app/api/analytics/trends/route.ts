/**
 * Analytics API - Trends Endpoint
 * 
 * WHAT: Returns time-series analytics data for trend analysis and visualization
 * WHY: Enable dashboard charts showing metrics evolution over time
 * 
 * Endpoint: GET /api/analytics/trends
 * Query params:
 *   - startDate: ISO date string (required)
 *   - endDate: ISO date string (required)
 *   - partnerId: Filter by partner (optional)
 *   - metrics: Comma-separated list (e.g., 'fans,merch,adValue') (default: all)
 *   - groupBy: 'day' | 'week' | 'month' (default: 'day')
 * 
 * Response: Time-series data points for requested metrics
 * Performance target: <500ms for 1-year datasets
 * 
 * Version: 6.26.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:58:43.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { logRequestStart, logRequestEnd, logRequestError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: '/api/analytics/trends',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
  
  try {
    // Rate limiting: Read operations (100 requests/minute)
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const partnerId = searchParams.get('partnerId');
    const metricsParam = searchParams.get('metrics');
    const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: startDate and endDate',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          error: 'startDate must be before endDate',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate partnerId if provided
    if (partnerId && !ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid partnerId format',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    const aggregatesCollection = db.collection('analytics_aggregates');
    
    // Build query filter
    const filter: any = {
      eventDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };
    
    if (partnerId) {
      filter['partnerContext.partnerId'] = new ObjectId(partnerId);
    }
    
    // Query aggregates in date range
    const aggregates = await aggregatesCollection
      .find(filter)
      .sort({ eventDate: 1 })
      .toArray();
    
    if (aggregates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          dateRange: { startDate, endDate },
          dataPoints: [],
          summary: {
            totalEvents: 0,
            dateRange: { startDate, endDate },
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Parse requested metrics
    const requestedMetrics = metricsParam
      ? metricsParam.split(',').map((m) => m.trim())
      : ['fans', 'merch', 'adValue', 'engagement'];
    
    // Group data by time bucket
    const dataPoints = aggregates.map((agg) => {
      const point: any = {
        date: agg.eventDate,
        projectId: agg.projectId.toString(),
        eventName: agg.partnerContext?.partnerName || 'Unknown',
      };
      
      // Add requested metrics
      if (requestedMetrics.includes('fans')) {
        point.fans = agg.fanMetrics?.totalFans || 0;
      }
      if (requestedMetrics.includes('merch')) {
        point.merch = agg.merchMetrics?.totalMerched || 0;
      }
      if (requestedMetrics.includes('adValue')) {
        point.adValue = agg.adMetrics?.totalROI || 0;
      }
      if (requestedMetrics.includes('engagement')) {
        point.engagement = agg.fanMetrics?.engagementRate || 0;
      }
      if (requestedMetrics.includes('penetration')) {
        point.penetration = agg.merchMetrics?.penetrationRate || 0;
      }
      
      return point;
    });
    
    // Calculate summary statistics
    const summary = {
      totalEvents: aggregates.length,
      dateRange: {
        startDate: aggregates[0].eventDate,
        endDate: aggregates[aggregates.length - 1].eventDate,
      },
      totals: {
        fans: dataPoints.reduce((sum, p) => sum + (p.fans || 0), 0),
        merch: dataPoints.reduce((sum, p) => sum + (p.merch || 0), 0),
        adValue: dataPoints.reduce((sum, p) => sum + (p.adValue || 0), 0),
      },
      averages: {
        engagement:
          dataPoints.reduce((sum, p) => sum + (p.engagement || 0), 0) / dataPoints.length,
        penetration:
          dataPoints.reduce((sum, p) => sum + (p.penetration || 0), 0) / dataPoints.length,
      },
    };
    
    logRequestEnd(startTime, { method: 'GET', pathname: '/api/analytics/trends' }, 200);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          dateRange: { startDate, endDate },
          groupBy,
          metrics: requestedMetrics,
          dataPoints,
          summary,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5-minute cache
        },
      }
    );
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    logRequestError(
      {
        method: 'GET',
        pathname: '/api/analytics/trends',
      },
      err,
      500
    );
    
    console.error('Error fetching trends analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching trends analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
