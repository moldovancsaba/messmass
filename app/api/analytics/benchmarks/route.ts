/**
 * Analytics API - Benchmarks Endpoint
 * 
 * WHAT: Returns benchmark statistics for league/category comparisons
 * WHY: Enable performance evaluation against industry/league standards
 * 
 * Endpoint: GET /api/analytics/benchmarks
 * Query params:
 *   - category: Filter by partner type or league (optional)
 *   - metric: Specific metric to benchmark (default: 'all')
 *   - period: Time period ('all', 'year', 'quarter', 'month') (default: 'all')
 * 
 * Response: Percentile distributions, averages, and outlier identification
 * Performance target: <500ms for full dataset
 * 
 * Version: 6.26.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:58:43.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { logRequestStart, logRequestEnd, logRequestError } from '@/lib/logger';

/**
 * WHAT: Calculate percentile value from sorted array
 * WHY: Industry-standard statistical benchmarking
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (lower === upper) {
    return sortedValues[lower];
  }
  
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export async function GET(request: NextRequest) {
  const startTime = logRequestStart({
    method: 'GET',
    pathname: '/api/analytics/benchmarks',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
  
  try {
    // Rate limiting: Read operations (100 requests/minute)
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const metricParam = searchParams.get('metric');
    const period = searchParams.get('period') || 'all';
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const aggregatesCollection = db.collection('analytics_aggregates');
    
    // Build query filter
    const filter: any = {};
    
    if (category) {
      filter['partnerContext.partnerType'] = category;
    }
    
    // Add period filter if needed
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      filter.eventDate = { $gte: startDate.toISOString().split('T')[0] };
    }
    
    // Query all aggregates
    const aggregates = await aggregatesCollection.find(filter).toArray();
    
    if (aggregates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          category: category || 'all',
          period,
          sampleSize: 0,
          benchmarks: {},
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Extract metric values
    const metrics = {
      fans: aggregates.map((a) => a.fanMetrics?.totalFans || 0).sort((a, b) => a - b),
      merch: aggregates.map((a) => a.merchMetrics?.totalMerched || 0).sort((a, b) => a - b),
      adValue: aggregates.map((a) => a.adMetrics?.totalROI || 0).sort((a, b) => a - b),
      engagement: aggregates.map((a) => a.fanMetrics?.engagementRate || 0).sort((a, b) => a - b),
      penetration: aggregates.map((a) => a.merchMetrics?.penetrationRate || 0).sort((a, b) => a - b),
      coreFanTeam: aggregates.map((a) => a.fanMetrics?.coreFanTeam || 0).sort((a, b) => a - b),
    };
    
    // Calculate benchmarks for each metric
    const benchmarks: any = {};
    const requestedMetrics = metricParam ? [metricParam] : Object.keys(metrics);
    
    requestedMetrics.forEach((metric) => {
      const values = metrics[metric as keyof typeof metrics];
      
      if (values && values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        
        benchmarks[metric] = {
          count: values.length,
          min: values[0],
          max: values[values.length - 1],
          mean: Math.round(mean * 100) / 100,
          median: calculatePercentile(values, 50),
          percentiles: {
            p10: calculatePercentile(values, 10),
            p25: calculatePercentile(values, 25),
            p75: calculatePercentile(values, 75),
            p90: calculatePercentile(values, 90),
            p95: calculatePercentile(values, 95),
          },
          // Standard deviation
          stdDev: Math.sqrt(
            values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
          ),
        };
      }
    });
    
    // Identify top performers (top 10%)
    const topPerformersThreshold = Math.ceil(aggregates.length * 0.1);
    const topPerformers = aggregates
      .sort((a, b) => {
        const aValue = a.fanMetrics?.coreFanTeam || 0;
        const bValue = b.fanMetrics?.coreFanTeam || 0;
        return bValue - aValue;
      })
      .slice(0, topPerformersThreshold)
      .map((a) => ({
        projectId: a.projectId.toString(),
        eventDate: a.eventDate,
        partnerName: a.partnerContext?.partnerName,
        coreFanTeam: a.fanMetrics?.coreFanTeam,
      }));
    
    logRequestEnd(startTime, { method: 'GET', pathname: '/api/analytics/benchmarks' }, 200);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          category: category || 'all',
          period,
          sampleSize: aggregates.length,
          benchmarks,
          topPerformers,
          metadata: {
            calculatedAt: new Date().toISOString(),
            methodology: 'Percentile-based statistical analysis',
          },
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30-minute cache
        },
      }
    );
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    logRequestError(
      {
        method: 'GET',
        pathname: '/api/analytics/benchmarks',
      },
      err,
      500
    );
    
    console.error('Error fetching benchmarks analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching benchmarks analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
