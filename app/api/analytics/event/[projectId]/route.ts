/**
 * Analytics API - Single Event Endpoint
 * 
 * WHAT: Returns pre-computed aggregated metrics for a single event
 * WHY: Provide <500ms query response for event analytics by serving pre-aggregated data
 * 
 * Endpoint: GET /api/analytics/event/[projectId]
 * Response: AnalyticsAggregate with all pre-computed metrics
 * 
 * Version: 6.25.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:12:27.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit';
import { logRequestStart, logRequestEnd, logRequestError } from '@/lib/logger';
import { validateProjectStats } from '@/lib/dataValidator';
import type { AnalyticsAPIResponse, AnalyticsAggregate } from '@/lib/analytics.types';

/**
 * WHAT: GET handler for single event analytics
 * WHY: Retrieve pre-computed metrics for fast response times
 * 
 * Query params:
 *   - includeBitly: Include Bitly metrics (default: true)
 *   - includeRaw: Include raw stats (default: false)
 * 
 * Performance target: <100ms response time
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // WHAT: Next.js 15 requires awaiting params Promise
  const { projectId } = await params;
  
  const startTime = logRequestStart({
    method: 'GET',
    pathname: `/api/analytics/event/${projectId}`,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
  
  try {
    // Rate limiting: Read operations (100 requests/minute)
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      // Rate limit exceeded, middleware returned error response
      return rateLimitResult;
    }
    
    // Validate projectId format
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
          timestamp: new Date().toISOString(),
        } as AnalyticsAPIResponse,
        { status: 400 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeBitly = searchParams.get('includeBitly') !== 'false'; // Default true
    const includeRaw = searchParams.get('includeRaw') === 'true'; // Default false
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    const aggregatesCollection = db.collection<AnalyticsAggregate>('analytics_aggregates');
    
    // Query pre-computed aggregate
    const aggregate = await aggregatesCollection.findOne({
      projectId: new ObjectId(projectId),
    });
    
    // If aggregate doesn't exist, return 404
    if (!aggregate) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/analytics/event/${projectId}` }, 404);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Analytics data not found for this project. The project may not have been aggregated yet.',
          timestamp: new Date().toISOString(),
        } as AnalyticsAPIResponse,
        { status: 404 }
      );
    }
    
    // Optionally filter out Bitly metrics and raw stats if not requested
    // WHAT: Omit properties instead of setting to undefined to maintain type safety
    const responseData: Partial<AnalyticsAggregate> = { ...aggregate };
    if (!includeBitly) {
      delete responseData.bitlyMetrics;
    }
    if (!includeRaw) {
      delete responseData.rawStats;
    }
    
    // WHAT: Validate source data quality
    // WHY: Inform frontend if analytics are based on incomplete data
    const validation = validateProjectStats(aggregate.rawStats || {});
    
    // Convert ObjectId to string for JSON serialization
    const serializedData = {
      ...responseData,
      _id: responseData._id?.toString(),
      projectId: responseData.projectId?.toString(),
      partnerContext: responseData.partnerContext ? {
        ...responseData.partnerContext,
        partnerId: responseData.partnerContext.partnerId?.toString(),
        opponentId: responseData.partnerContext.opponentId?.toString(),
      } : undefined,
      // WHAT: Include data quality metadata
      // WHY: Frontend can show warnings for analytics based on incomplete data
      dataQuality: {
        completeness: validation.completeness,
        quality: validation.dataQuality,
        hasMinimumData: validation.hasMinimumData,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      }
    };
    
    logRequestEnd(startTime, { method: 'GET', pathname: `/api/analytics/event/${projectId}` }, 200);
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: serializedData,
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
        pathname: `/api/analytics/event/${projectId}`,
      },
      err,
      500
    );
    
    console.error('Error fetching analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching analytics',
        timestamp: new Date().toISOString(),
      } as AnalyticsAPIResponse,
      { status: 500 }
    );
  }
}
