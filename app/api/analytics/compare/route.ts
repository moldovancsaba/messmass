/**
 * Analytics API - Compare Endpoint
 * 
 * WHAT: Compares analytics metrics between two or more events
 * WHY: Enable side-by-side performance analysis and benchmarking
 * 
 * Endpoint: GET /api/analytics/compare
 * Query params:
 *   - projectIds: Comma-separated list of project IDs (2-5 required)
 *   - metrics: Comma-separated list of metrics to compare (default: all)
 * 
 * Response: Comparative analysis with deltas and rankings
 * Performance target: <300ms for 5 events
 * 
 * Version: 6.26.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:58:43.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { logRequestStart, logRequestEnd, logRequestError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: '/api/analytics/compare',
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
    const projectIdsParam = searchParams.get('projectIds');
    const metricsParam = searchParams.get('metrics');
    
    if (!projectIdsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: projectIds',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Parse project IDs
    const projectIdStrings = projectIdsParam.split(',').map((id) => id.trim());
    
    if (projectIdStrings.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least 2 project IDs required for comparison',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (projectIdStrings.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 5 projects can be compared at once',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Validate all project IDs
    const projectIds: ObjectId[] = [];
    for (const idStr of projectIdStrings) {
      if (!ObjectId.isValid(idStr)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid project ID format: ${idStr}`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      projectIds.push(new ObjectId(idStr));
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const aggregatesCollection = db.collection('analytics_aggregates');
    
    // Fetch all aggregates
    const aggregates = await aggregatesCollection
      .find({
        projectId: { $in: projectIds },
      })
      .toArray();
    
    // Check if all projects have aggregates
    if (aggregates.length !== projectIds.length) {
      const foundIds = new Set(aggregates.map((a) => a.projectId.toString()));
      const missingIds = projectIds
        .filter((id) => !foundIds.has(id.toString()))
        .map((id) => id.toString());
      
      return NextResponse.json(
        {
          success: false,
          error: `Analytics not found for project IDs: ${missingIds.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    
    // Parse requested metrics
    const requestedMetrics = metricsParam
      ? metricsParam.split(',').map((m) => m.trim())
      : ['fans', 'merch', 'adValue', 'engagement', 'penetration'];
    
    // Build comparison data
    const events = aggregates.map((agg) => {
      const event: any = {
        projectId: agg.projectId.toString(),
        eventDate: agg.eventDate,
        partnerName: agg.partnerContext?.partnerName || 'Unknown',
      };
      
      // Add requested metrics
      if (requestedMetrics.includes('fans')) {
        event.fans = agg.fanMetrics?.totalFans || 0;
      }
      if (requestedMetrics.includes('merch')) {
        event.merch = agg.merchMetrics?.totalMerched || 0;
      }
      if (requestedMetrics.includes('adValue')) {
        event.adValue = agg.adMetrics?.totalROI || 0;
      }
      if (requestedMetrics.includes('engagement')) {
        event.engagement = agg.fanMetrics?.engagementRate || 0;
      }
      if (requestedMetrics.includes('penetration')) {
        event.penetration = agg.merchMetrics?.penetrationRate || 0;
      }
      
      return event;
    });
    
    // Calculate comparison statistics
    const comparison: any = {
      metrics: requestedMetrics,
      events,
      rankings: {},
      deltas: {},
    };
    
    // Generate rankings for each metric
    requestedMetrics.forEach((metric) => {
      const sorted = [...events].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
      comparison.rankings[metric] = sorted.map((e) => ({
        projectId: e.projectId,
        value: e[metric],
      }));
    });
    
    // Calculate deltas between first and other events
    if (events.length >= 2) {
      const baseline = events[0];
      comparison.deltas = events.slice(1).map((event) => {
        const delta: any = {
          projectId: event.projectId,
          comparedTo: baseline.projectId,
          metrics: {},
        };
        
        requestedMetrics.forEach((metric) => {
          const baselineValue = baseline[metric] || 0;
          const eventValue = event[metric] || 0;
          const absoluteDelta = eventValue - baselineValue;
          const percentDelta = baselineValue !== 0
            ? ((eventValue - baselineValue) / baselineValue) * 100
            : 0;
          
          delta.metrics[metric] = {
            absolute: absoluteDelta,
            percent: percentDelta,
          };
        });
        
        return delta;
      });
    }
    
    logRequestEnd(startTime, { method: 'GET', pathname: '/api/analytics/compare' }, 200);
    
    return NextResponse.json(
      {
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // 10-minute cache
        },
      }
    );
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    logRequestError(
      {
        method: 'GET',
        pathname: '/api/analytics/compare',
      },
      err,
      500
    );
    
    console.error('Error fetching comparison analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching comparison analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
