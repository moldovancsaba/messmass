/**
 * GET /api/cron/bitly-refresh
 * 
 * WHAT: Background job that refreshes all cached Bitly metrics daily.
 * WHY: After nightly Bitly sync completes and new analytics data is available,
 * cached metrics in the junction table must be updated to reflect latest data.
 * 
 * SCHEDULE: Daily at 04:00 UTC (recommended to run after Bitly sync)
 * 
 * TRIGGER OPTIONS:
 * 1. Vercel Cron Jobs (vercel.json configuration)
 * 2. External cron service (e.g., cron-job.org, GitHub Actions)
 * 3. Manual trigger via admin UI
 * 
 * WHAT IT DOES:
 * - Fetches all junction table entries
 * - Re-aggregates metrics using existing date ranges
 * - Updates cachedMetrics and lastSyncedAt fields
 * - Does NOT recalculate date ranges (keeps boundaries stable)
 * 
 * NOTE: Date range recalculation only happens on:
 * - Event date changes
 * - Event creation/deletion
 * - Manual refresh via /api/bitly/recalculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAllCachedMetrics } from '@/lib/bitly-recalculator';

/**
 * Response schema
 */
interface CronRefreshResponse {
  success: boolean;
  associationsRefreshed: number;
  timestamp: string;
  duration?: number; // milliseconds
  error?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    console.log(`[Bitly Cron] Starting daily metric refresh at ${timestamp}`);

    // Optional: Verify cron authorization
    // WHY: Prevent unauthorized external calls to this endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Bitly Cron] Unauthorized request - invalid or missing auth token');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          timestamp,
        },
        { status: 401 }
      );
    }

    // Refresh all cached metrics
    // WHY: Updates metrics while preserving date ranges
    const associationsRefreshed = await refreshAllCachedMetrics();

    const duration = Date.now() - startTime;
    console.log(
      `[Bitly Cron] Completed refresh: ${associationsRefreshed} associations updated in ${duration}ms`
    );

    const response: CronRefreshResponse = {
      success: true,
      associationsRefreshed,
      timestamp,
      duration,
    };

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Bitly Cron] Refresh failed:', error);

    const response: CronRefreshResponse = {
      success: false,
      associationsRefreshed: 0,
      timestamp,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/cron/bitly-refresh
 * 
 * WHAT: Alternative endpoint for POST-based cron triggers.
 * WHY: Some cron services prefer POST requests.
 */
export async function POST(request: NextRequest) {
  // Reuse GET handler
  return GET(request);
}
