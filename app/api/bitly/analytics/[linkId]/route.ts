// app/api/bitly/analytics/[linkId]/route.ts
// WHAT: API endpoint for fetching detailed Bitly link analytics
// WHY: Provides comprehensive analytics data for dashboard visualization
// ENDPOINT: GET /api/bitly/analytics/[linkId]

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getFullAnalytics } from '@/lib/bitly';
import { 
  mapClicksSummary, 
  mapSeriesToDaily, 
  mapCountries, 
  mapReferrers,
  mergeTimeseries 
} from '@/lib/bitly-mappers';
import { error as logError, info as logInfo } from '@/lib/logger';

/**
 * GET /api/bitly/analytics/[linkId]
 * WHAT: Fetch comprehensive analytics for a specific Bitly link
 * WHY: Powers analytics dashboards with click trends, geographic data, and referrer info
 * 
 * AUTH: Admin only
 * QUERY PARAMS:
 *   - refresh: boolean (default: false) - Fetch fresh data from Bitly API before returning
 * 
 * RESPONSE INCLUDES:
 *   - click_summary: { total, unique, updatedAt }
 *   - clicks_timeseries: [{ date, clicks }] (daily, last 365 days)
 *   - geo: { countries: [{ country, clicks }], cities: [...] }
 *   - referrers: [{ referrer, clicks }]
 *   - lastSyncAt: timestamp of last successful sync
 *   - metadata: bitlink, long_url, title, tags, campaign
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Analytics data is sensitive and admin-only
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Validate linkId parameter
    const { linkId } = await context.params;
    if (!ObjectId.isValid(linkId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid linkId format' },
        { status: 400 }
      );
    }

    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // WHAT: Fetch link document from database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const link = await db.collection('bitly_links').findOne({ _id: new ObjectId(linkId) });

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    // WHAT: Handle refresh request - fetch fresh data from Bitly API
    // WHY: Allows on-demand analytics refresh before automated sync
    if (refresh) {
      try {
        console.log(`[Analytics] Refreshing data for link ${linkId} (${link.bitlink})`);

        // WHAT: Fetch all analytics from Bitly API in parallel
        // WHY: Minimizes total request time and respects rate limits
        const analytics = await getFullAnalytics(link.bitlink);

        // WHAT: Map API responses to MongoDB structures
        const updatedClickSummary = mapClicksSummary(analytics.summary);
        const newTimeseries = mapSeriesToDaily(analytics.series);
        const updatedCountries = mapCountries(analytics.countries);
        const updatedReferrers = mapReferrers(analytics.referrers);

        // WHAT: Merge new timeseries data with existing data
        // WHY: Preserves historical data while adding new days
        const mergedTimeseries = mergeTimeseries(link.clicks_timeseries || [], newTimeseries);

        // WHAT: Calculate last synced date from timeseries
        // WHY: Tracks incremental sync progress
        const lastClicksSyncedUntil = mergedTimeseries.length > 0
          ? mergedTimeseries[mergedTimeseries.length - 1].date
          : undefined;

        // WHAT: Update database with fresh analytics
        const now = new Date().toISOString();
        const updateResult = await db.collection('bitly_links').findOneAndUpdate(
          { _id: new ObjectId(linkId) },
          {
            $set: {
              click_summary: updatedClickSummary,
              clicks_timeseries: mergedTimeseries,
              'geo.countries': updatedCountries,
              referrers: updatedReferrers,
              lastSyncAt: now,
              lastClicksSyncedUntil,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

        // WHAT: Return refreshed link data
        return NextResponse.json({
          success: true,
          link: updateResult,
          message: 'Analytics refreshed successfully',
          refreshed: true,
        });

      } catch (error) {
        logError('Analytics refresh failed', { context: 'bitly-analytics', linkId }, error instanceof Error ? error : new Error(String(error)));
        // WHAT: Return stale data if refresh fails
        // WHY: Partial failure shouldn't break the entire request
        return NextResponse.json({
          success: true,
          link,
          message: 'Failed to refresh analytics, returning cached data',
          refreshed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // WHAT: Return cached analytics data (no refresh requested)
    // WHY: Faster response; sync service keeps data fresh automatically
    return NextResponse.json({
      success: true,
      link,
      refreshed: false,
    });

  } catch (error) {
    logError('GET /api/bitly/analytics/[linkId] error', { context: 'bitly-analytics', linkId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
