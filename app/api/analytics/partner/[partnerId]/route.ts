/**
 * Analytics API - Partner Analytics Endpoint
 * 
 * WHAT: Returns aggregated metrics for all events associated with a partner (team/organization)
 * WHY: Enable partner performance tracking across multiple events and time periods
 * 
 * Endpoint: GET /api/analytics/partner/[partnerId]
 * Query params:
 *   - timeframe: 'all' | 'season' | 'year' | 'month' (default: 'all')
 *   - includeEvents: Include individual event breakdown (default: false)
 * 
 * Response: Partner summary with aggregated KPIs across all events
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params;
  
  const startTime = logRequestStart({
    method: 'GET',
    pathname: `/api/analytics/partner/${partnerId}`,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });
  
  try {
    // Rate limiting: Read operations (100 requests/minute)
    const rateLimitResult = await rateLimitMiddleware(request, RATE_LIMITS.READ);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Validate partnerId format
    if (!ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid partner ID format',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';
    const includeEvents = searchParams.get('includeEvents') === 'true';
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const aggregatesCollection = db.collection('analytics_aggregates');
    const partnersCollection = db.collection('partners');
    
    // Fetch partner details
    const partner = await partnersCollection.findOne({
      _id: new ObjectId(partnerId),
    });
    
    if (!partner) {
      logRequestEnd(startTime, { method: 'GET', pathname: `/api/analytics/partner/${partnerId}` }, 404);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Partner not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    
    // Query all aggregates for this partner
    const partnerObjectId = new ObjectId(partnerId);
    const aggregates = await aggregatesCollection
      .find({
        'partnerContext.partnerId': partnerObjectId,
      })
      .sort({ eventDate: -1 })
      .toArray();
    
    if (aggregates.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          partnerId,
          partnerName: partner.name,
          partnerType: partner.type,
          eventCount: 0,
          summary: null,
          events: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Calculate aggregated summary across all events
    const summary = {
      totalEvents: aggregates.length,
      totalFans: 0,
      totalImages: 0,
      totalMerched: 0,
      totalAdValue: 0,
      avgEngagementRate: 0,
      avgPenetrationRate: 0,
      dateRange: {
        earliest: aggregates[aggregates.length - 1].eventDate,
        latest: aggregates[0].eventDate,
      },
    };
    
    // Accumulate metrics
    aggregates.forEach((agg) => {
      summary.totalFans += agg.fanMetrics?.totalFans || 0;
      summary.totalImages += agg.fanMetrics?.totalImages || 0;
      summary.totalMerched += agg.merchMetrics?.totalMerched || 0;
      summary.totalAdValue += agg.adMetrics?.totalROI || 0;
      summary.avgEngagementRate += agg.fanMetrics?.engagementRate || 0;
      summary.avgPenetrationRate += agg.merchMetrics?.penetrationRate || 0;
    });
    
    // Calculate averages
    summary.avgEngagementRate /= aggregates.length;
    summary.avgPenetrationRate /= aggregates.length;
    
    // Optionally include individual event breakdown
    const events = includeEvents
      ? aggregates.map((agg) => ({
          projectId: agg.projectId.toString(),
          eventDate: agg.eventDate,
          isHomeGame: agg.partnerContext?.isHomeGame,
          opponentName: agg.partnerContext?.opponentName,
          fans: agg.fanMetrics?.totalFans,
          merched: agg.merchMetrics?.totalMerched,
          adValue: agg.adMetrics?.totalROI,
          engagementRate: agg.fanMetrics?.engagementRate,
        }))
      : [];
    
    logRequestEnd(startTime, { method: 'GET', pathname: `/api/analytics/partner/${partnerId}` }, 200);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          partnerId,
          partnerName: partner.name,
          partnerType: partner.type,
          partnerEmoji: partner.emoji,
          eventCount: aggregates.length,
          summary,
          events,
        },
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
        pathname: `/api/analytics/partner/${partnerId}`,
      },
      err,
      500
    );
    
    console.error('Error fetching partner analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching partner analytics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
