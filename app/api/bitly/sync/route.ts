// app/api/bitly/sync/route.ts
// WHAT: API endpoint for triggering Bitly analytics sync (manual and cron)
// WHY: Keeps analytics data fresh without manual intervention; supports both scheduled and on-demand sync
// ENDPOINT: POST /api/bitly/sync
// TRIGGER: Manual (admin UI button) or Automated (Vercel cron at 03:00 UTC)

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getFullAnalytics } from '@/lib/bitly';
import {
  mapClicksSummary,
  mapSeriesToDaily,
  mapCountries,
  mapReferrers,
  mapReferringDomains,
  mergeTimeseries,
  calculateSyncStartDate,
} from '@/lib/bitly-mappers';
import type { BitlySyncResponse } from '@/lib/bitly-db.types';

// WHAT: Configure route for Node.js runtime (required for cron)
// WHY: Vercel cron jobs require Node.js runtime, not Edge
export const runtime = 'nodejs';

// WHAT: Increase function timeout for sync operations
// WHY: Syncing multiple links can take time due to API rate limits
export const maxDuration = 60; // 60 seconds

/**
 * WHAT: Sync a single Bitly link's analytics from Bitly API to MongoDB
 * WHY: Encapsulates sync logic for reusability and error isolation
 * 
 * STRATEGY:
 * - Fetch all analytics endpoints in parallel for efficiency
 * - Merge new data with existing timeseries to preserve history
 * - Update MongoDB document atomically
 * - Return success/error status for logging
 */
async function syncSingleLink(
  db: any,
  link: any,
  runId: string
): Promise<{ success: boolean; error?: string; apiCalls: number }> {
  let apiCalls = 0;

  try {
    console.log(`[Sync ${runId}] Syncing link: ${link.bitlink}`);

    // WHAT: Fetch all analytics from Bitly API in parallel
    // WHY: Minimizes total sync time and reduces sequential API calls
    const analytics = await getFullAnalytics(link.bitlink);
    apiCalls = 5; // summary + series + countries + referrers + referring_domains

    // WHAT: Map API responses to MongoDB structures
    const updatedClickSummary = mapClicksSummary(analytics.summary);
    const newTimeseries = mapSeriesToDaily(analytics.series);
    const updatedCountries = mapCountries(analytics.countries);
    const updatedReferrers = mapReferrers(analytics.referrers);
    const updatedReferringDomains = mapReferringDomains(analytics.referring_domains);

    // WHAT: Merge new timeseries with existing data
    // WHY: Preserves historical data while adding new days
    const mergedTimeseries = mergeTimeseries(link.clicks_timeseries || [], newTimeseries);

    // WHAT: Calculate last synced date boundary
    // WHY: Enables incremental sync in next run
    const lastClicksSyncedUntil =
      mergedTimeseries.length > 0 ? mergedTimeseries[mergedTimeseries.length - 1].date : undefined;

    // WHAT: Update MongoDB document with fresh analytics
    const now = new Date().toISOString();
    await db.collection('bitly_links').updateOne(
      { _id: link._id },
      {
        $set: {
          click_summary: updatedClickSummary,
          clicks_timeseries: mergedTimeseries,
          'geo.countries': updatedCountries,
          referrers: updatedReferrers,
          referring_domains: updatedReferringDomains,
          lastSyncAt: now,
          lastClicksSyncedUntil,
          updatedAt: now,
        },
      }
    );

    console.log(`[Sync ${runId}] ✓ Successfully synced ${link.bitlink}`);
    return { success: true, apiCalls };
  } catch (error) {
    console.error(`[Sync ${runId}] ✗ Failed to sync ${link.bitlink}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiCalls,
    };
  }
}

/**
 * WHAT: Sync multiple links with concurrency control
 * WHY: Respects Bitly API rate limits while maximizing throughput
 * 
 * STRATEGY:
 * - Process links in parallel batches (pool size: 3-5)
 * - Respect Growth tier rate limits
 * - Continue on individual link failures (collect errors)
 * - Return aggregate metrics for logging
 */
async function syncLinks(
  db: any,
  links: any[],
  runId: string,
  concurrency: number = 3
): Promise<{
  linksUpdated: number;
  totalApiCalls: number;
  errors: Array<{ linkId: string; bitlink: string; message: string }>;
}> {
  const errors: Array<{ linkId: string; bitlink: string; message: string }> = [];
  let linksUpdated = 0;
  let totalApiCalls = 0;

  // WHAT: Process links in parallel batches
  // WHY: Controls concurrency to respect rate limits
  for (let i = 0; i < links.length; i += concurrency) {
    const batch = links.slice(i, i + concurrency);

    // WHAT: Execute batch in parallel
    const results = await Promise.all(batch.map((link) => syncSingleLink(db, link, runId)));

    // WHAT: Aggregate results
    results.forEach((result, idx) => {
      totalApiCalls += result.apiCalls;
      if (result.success) {
        linksUpdated++;
      } else {
        errors.push({
          linkId: batch[idx]._id.toString(),
          bitlink: batch[idx].bitlink,
          message: result.error || 'Unknown error',
        });
      }
    });

    // WHAT: Small delay between batches to avoid rate limit spikes
    // WHY: Smooths out API call distribution
    if (i + concurrency < links.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second between batches
    }
  }

  return { linksUpdated, totalApiCalls, errors };
}

/**
 * POST /api/bitly/sync
 * WHAT: Trigger Bitly analytics sync (manual or cron)
 * WHY: Keeps analytics data fresh without manual intervention
 * 
 * AUTH: Admin only (manual) or Vercel cron (automated)
 * BODY (optional): { linkIds?: string[] } - Sync specific links only
 * 
 * SCENARIOS:
 * 1. Manual sync all links (admin button)
 * 2. Manual sync specific link (per-link refresh button)
 * 3. Automated sync all links (Vercel cron at 03:00 UTC)
 */
export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  const runId = uuidv4();

  try {
    // WHAT: Check if request is from Vercel cron
    // WHY: Cron requests have special authentication via headers
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // WHAT: Verify admin authentication for manual triggers
    // WHY: Only admins can manually trigger sync
    if (!isCron) {
      const user = await getAdminUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const scope = isCron ? 'cron' : 'manual';
    console.log(`[Sync ${runId}] Starting ${scope} sync at ${startedAt}`);

    // WHAT: Parse request body for selective sync
    const body = await request.json().catch(() => ({}));
    const { linkIds } = body;

    // WHAT: Build query filter
    // WHY: Supports both full sync and selective link sync
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const filter: any = { archived: { $ne: true } };

    if (linkIds && Array.isArray(linkIds) && linkIds.length > 0) {
      // WHAT: Sync specific links only
      // WHY: Enables on-demand refresh for individual links
      filter._id = { $in: linkIds.map((id) => new ObjectId(id)) };
    }

    // WHAT: Fetch links to sync
    const links = await db.collection('bitly_links').find(filter).toArray();

    if (links.length === 0) {
      console.log(`[Sync ${runId}] No links to sync`);
      return NextResponse.json({
        success: true,
        runId,
        startedAt,
        endedAt: new Date().toISOString(),
        status: 'success',
        summary: {
          linksScanned: 0,
          linksUpdated: 0,
          errors: 0,
        },
        message: 'No links to sync',
      } as BitlySyncResponse);
    }

    console.log(`[Sync ${runId}] Found ${links.length} links to sync`);

    // WHAT: Execute sync with concurrency control
    // WHY: Respects Growth tier rate limits while maximizing throughput
    const syncResults = await syncLinks(db, links, runId, 3);

    // WHAT: Create sync log entry
    // WHY: Provides observability and debugging for sync operations
    const endedAt = new Date().toISOString();
    const logEntry = {
      runId,
      scope,
      startedAt,
      endedAt,
      status: syncResults.errors.length === 0 ? 'success' : syncResults.errors.length < links.length ? 'partial' : 'error',
      metrics: {
        linksScanned: links.length,
        linksUpdated: syncResults.linksUpdated,
        apiCalls: syncResults.totalApiCalls,
        rateLimitResets: 0, // Could be enhanced to track actual resets
      },
      errors:
        syncResults.errors.length > 0
          ? syncResults.errors.map((err) => ({
              code: undefined,
              message: err.message,
              retriable: true,
              at: endedAt,
            }))
          : undefined,
      createdAt: endedAt,
      updatedAt: endedAt,
    };

    await db.collection('bitly_sync_logs').insertOne(logEntry);

    // WHAT: Return sync summary
    const response: BitlySyncResponse = {
      success: true,
      runId,
      startedAt,
      endedAt,
      status: logEntry.status as 'success' | 'partial' | 'error',
      summary: {
        linksScanned: links.length,
        linksUpdated: syncResults.linksUpdated,
        errors: syncResults.errors.length,
      },
      message:
        syncResults.errors.length === 0
          ? `Successfully synced ${syncResults.linksUpdated} links`
          : `Synced ${syncResults.linksUpdated}/${links.length} links with ${syncResults.errors.length} errors`,
    };

    console.log(`[Sync ${runId}] Completed:`, response.summary);

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[Sync ${runId}] Fatal error:`, error);

    // WHAT: Log fatal error to database
    const endedAt = new Date().toISOString();
    try {
      const client = await clientPromise;
      const db = client.db(config.dbName);
      await db.collection('bitly_sync_logs').insertOne({
        runId,
        scope: 'manual', // Default to manual if scope undetermined
        startedAt,
        endedAt,
        status: 'error',
        metrics: {
          linksScanned: 0,
          linksUpdated: 0,
          apiCalls: 0,
          rateLimitResets: 0,
        },
        errors: [
          {
            code: undefined,
            message: error instanceof Error ? error.message : 'Unknown fatal error',
            retriable: true,
            at: endedAt,
          },
        ],
        createdAt: endedAt,
        updatedAt: endedAt,
      });
    } catch (logError) {
      console.error(`[Sync ${runId}] Failed to log error:`, logError);
    }

    return NextResponse.json(
      {
        success: false,
        runId,
        startedAt,
        endedAt,
        status: 'error',
        summary: {
          linksScanned: 0,
          linksUpdated: 0,
          errors: 1,
        },
        message: error instanceof Error ? error.message : 'Fatal sync error',
      } as BitlySyncResponse,
      { status: 500 }
    );
  }
}
