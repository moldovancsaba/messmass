/**
 * Analytics Aggregates API
 * 
 * WHAT: Query pre-aggregated analytics data for fast performance
 * WHY: Avoid expensive real-time calculations - query pre-computed metrics
 * 
 * PERFORMANCE TARGET: < 500ms response time for 1-year datasets
 * 
 * ENDPOINTS:
 * - GET /api/analytics/aggregates - Query time-bucketed aggregates
 * - GET /api/analytics/aggregates/partners - Query partner analytics
 * 
 * Version: 6.1.0
 * Created: 2025-01-21T17:00:00.000Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Db, Collection } from 'mongodb';
import {
  TimeAggregatedMetrics,
  PartnerAnalytics,
  AggregateDataResponse,
  PartnerAnalyticsResponse,
  AggregateQueryFilters
} from '@/lib/analytics-aggregates.types';

/**
 * GET /api/analytics/aggregates
 * 
 * Query time-aggregated metrics with filters
 * 
 * Query Parameters:
 * - bucket: 'daily' | 'weekly' | 'monthly' | 'yearly'
 * - startDate: ISO 8601 date (e.g., '2024-01-01')
 * - endDate: ISO 8601 date
 * - partnerId: Filter by partner
 * - partnerIds: Filter by multiple partners (comma-separated)
 * - hashtag: Filter by hashtag
 * - year: Filter by year
 * - month: Filter by month (1-12)
 * - limit: Number of records (default: 100, max: 1000)
 * - offset: Pagination offset
 * - sortBy: 'date' | 'attendance' | 'engagement' | 'merchandise'
 * - sortOrder: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication check - admin only
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: AggregateQueryFilters = {
      bucket: (searchParams.get('bucket') as any) || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      partnerId: searchParams.get('partnerId') || undefined,
      partnerIds: searchParams.get('partnerIds')?.split(',').filter(Boolean) || undefined,
      hashtag: searchParams.get('hashtag') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '100'), 1000),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    };
    
    // Connect to database
    const client = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB || 'messmass');
    const aggregatesCollection: Collection<TimeAggregatedMetrics> = db.collection('analytics_aggregates');
    
    // Build MongoDB query
    const query: any = {};
    
    if (filters.bucket) {
      query.bucket = filters.bucket;
    }
    
    if (filters.startDate || filters.endDate) {
      query.periodStart = {};
      if (filters.startDate) query.periodStart.$gte = filters.startDate;
      if (filters.endDate) query.periodStart.$lte = filters.endDate;
    }
    
    if (filters.partnerId) {
      query.partnerId = filters.partnerId;
    }
    
    if (filters.partnerIds && filters.partnerIds.length > 0) {
      query.partnerId = { $in: filters.partnerIds };
    }
    
    if (filters.hashtag) {
      query.hashtag = filters.hashtag;
    }
    
    if (filters.year) {
      query.year = filters.year;
    }
    
    if (filters.month) {
      query.month = filters.month;
    }
    
    // Build sort object
    const sortField = filters.sortBy === 'date' ? 'periodStart' :
                      filters.sortBy === 'attendance' ? 'totalAttendees' :
                      filters.sortBy === 'engagement' ? 'avgEngagementRate' :
                      filters.sortBy === 'merchandise' ? 'merchandiseRate' :
                      'periodStart';
    
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };
    
    // Execute query with pagination
    const [data, totalRecords] = await Promise.all([
      aggregatesCollection
        .find(query)
        .sort(sort)
        .skip(filters.offset || 0)
        .limit(filters.limit || 100)
        .toArray(),
      aggregatesCollection.countDocuments(query)
    ]);
    
    const queryTimeMs = Date.now() - startTime;
    const returnedRecords = data.length;
    const hasMore = (filters.offset || 0) + returnedRecords < totalRecords;
    const nextOffset = hasMore ? (filters.offset || 0) + returnedRecords : undefined;
    
    // Get latest aggregation timestamp
    const latest = await aggregatesCollection.findOne({}, { sort: { lastAggregatedAt: -1 } });
    const aggregatedAt = latest?.lastAggregatedAt || new Date().toISOString();
    
    const response: AggregateDataResponse = {
      data,
      metadata: {
        totalRecords,
        returnedRecords,
        hasMore,
        nextOffset,
        aggregatedAt,
        queryTimeMs
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Analytics aggregates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics aggregates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
