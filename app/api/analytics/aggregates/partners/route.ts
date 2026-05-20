/**
 * Partner Analytics API
 * 
 * WHAT: Query partner-level aggregated analytics
 * WHY: Provide fast partner performance rollups for admin analytics surfaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { Db, Collection } from 'mongodb';
import config from '@/lib/config';
import {
  PartnerAnalytics,
  PartnerAnalyticsResponse
} from '@/lib/analytics-aggregates.types';

/**
 * GET /api/analytics/aggregates/partners
 * 
 * Query partner analytics
 * 
 * Query Parameters:
 * - partnerId: Filter by specific partner
 * - limit: Number of records (default: 100, max: 1000)
 * - offset: Pagination offset
 * - sortBy: 'name' | 'totalEvents' | 'totalAttendees' | 'avgAttendees'
 * - sortOrder: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication check: admin session required
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse partner analytics query parameters
    const partnerId = searchParams.get('partnerId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'partnerName';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Connect to the partner analytics aggregate collection
    const client = await clientPromise;
    const db: Db = client.db(config.dbName);
    const analyticsCollection: Collection<PartnerAnalytics> = db.collection('partner_analytics');
    
    // Build the partner analytics filter
    const query: any = {};
    if (partnerId) {
      query.partnerId = partnerId;
    }
    
    // Translate API sort semantics into collection field names
    const sortField = sortBy === 'name' ? 'partnerName' :
                      sortBy === 'totalEvents' ? 'totalEvents' :
                      sortBy === 'totalAttendees' ? 'totalAttendees' :
                      sortBy === 'avgAttendees' ? 'avgAttendeesPerEvent' :
                      'partnerName';
    
    const sort: any = { [sortField]: sortOrder };
    
    // Execute the paginated partner analytics query
    const [data, totalPartners] = await Promise.all([
      analyticsCollection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray(),
      analyticsCollection.countDocuments(query)
    ]);
    
    const queryTimeMs = Date.now() - startTime;
    const returnedRecords = data.length;
    const hasMore = offset + returnedRecords < totalPartners;
    const nextOffset = hasMore ? offset + returnedRecords : undefined;
    
    // Get latest aggregation timestamp
    const latest = await analyticsCollection.findOne({}, { sort: { lastAggregatedAt: -1 } });
    const aggregatedAt = latest?.lastAggregatedAt || new Date().toISOString();
    
    const response: PartnerAnalyticsResponse = {
      data,
      metadata: {
        totalPartners,
        returnedRecords,
        hasMore,
        nextOffset,
        aggregatedAt,
        queryTimeMs
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Partner analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
