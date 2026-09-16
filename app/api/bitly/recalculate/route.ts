/**
 * POST /api/bitly/recalculate
 * 
 * WHAT: Manually triggers recalculation of date ranges and cached metrics.
 * WHY: Admin tool for forcing refresh when automatic triggers don't fire,
 * or when testing/debugging the many-to-many system.
 * 
 * MODES:
 * 1. Recalculate specific bitlink (all its project associations)
 * 2. Recalculate specific project (all its bitlink associations)
 * 3. Recalculate all associations (full system refresh)
 * 
 * USE CASES:
 * - Admin UI "Refresh" button on Bitly page
 * - Debugging date range issues
 * - After manual data corrections
 * - Periodic maintenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireSession } from '@/lib/apiGuards';
import { getDb } from '@/lib/db';
import {
  recalculateLinkRanges,
  recalculateProjectLinks,
  refreshAllCachedMetrics,
} from '@/lib/bitly-recalculator';
import { error as logError, info as logInfo, debug as logDebug } from '@/lib/logger';

/**
 * Request body schema
 */
interface RecalculateRequest {
  mode: 'bitlink' | 'project' | 'all';
  bitlyLinkId?: string; // Required if mode=bitlink
  projectId?: string; // Required if mode=project
}

/**
 * Response schema
 */
interface RecalculateResponse {
  success: boolean;
  mode: string;
  associationsUpdated?: number;
  bitlinksAffected?: number;
  message: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  try {
    const body: RecalculateRequest = await request.json();

    // Validate request body
    if (!body.mode || !['bitlink', 'project', 'all'].includes(body.mode)) {
      return NextResponse.json(
        {
          error: 'Invalid mode. Must be "bitlink", "project", or "all"',
        },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // MODE 1: Recalculate specific bitlink
    if (body.mode === 'bitlink') {
      if (!body.bitlyLinkId) {
        return NextResponse.json(
          { error: 'bitlyLinkId required for mode=bitlink' },
          { status: 400 }
        );
      }

      if (!ObjectId.isValid(body.bitlyLinkId)) {
        return NextResponse.json(
          { error: 'Invalid bitlyLinkId format' },
          { status: 400 }
        );
      }

      logInfo('Recalculating bitlink', { context: 'bitly-recalculate', mode: 'bitlink', bitlyLinkId: body.bitlyLinkId, timestamp });

      const bitlyLinkId = new ObjectId(body.bitlyLinkId);
      const updatedAssociations = await recalculateLinkRanges(bitlyLinkId);

      const response: RecalculateResponse = {
        success: true,
        mode: 'bitlink',
        associationsUpdated: updatedAssociations.length,
        message: `Successfully recalculated ${updatedAssociations.length} project associations for bitlink`,
        timestamp,
      };

      return NextResponse.json(response);
    }

    // MODE 2: Recalculate specific project
    if (body.mode === 'project') {
      if (!body.projectId) {
        return NextResponse.json(
          { error: 'projectId required for mode=project' },
          { status: 400 }
        );
      }

      if (!ObjectId.isValid(body.projectId)) {
        return NextResponse.json(
          { error: 'Invalid projectId format' },
          { status: 400 }
        );
      }

      logInfo('Recalculating project', { context: 'bitly-recalculate', mode: 'project', projectId: body.projectId, timestamp });

      const projectId = new ObjectId(body.projectId);
      const bitlinksAffected = await recalculateProjectLinks(projectId);

      const response: RecalculateResponse = {
        success: true,
        mode: 'project',
        bitlinksAffected,
        message: `Successfully recalculated ${bitlinksAffected} bitlinks for project`,
        timestamp,
      };

      return NextResponse.json(response);
    }

    // MODE 3: Recalculate all associations
    if (body.mode === 'all') {
      logInfo('Recalculating all associations', { context: 'bitly-recalculate', mode: 'all', timestamp });

      const associationsUpdated = await refreshAllCachedMetrics();

      const response: RecalculateResponse = {
        success: true,
        mode: 'all',
        associationsUpdated,
        message: `Successfully refreshed cached metrics for ${associationsUpdated} associations`,
        timestamp,
      };

      return NextResponse.json(response);
    }

    // Should never reach here due to validation above
    return NextResponse.json(
      { error: 'Invalid mode' },
      { status: 400 }
    );
  } catch (error) {
    logError('Recalculate API error', { context: 'bitly-recalculate' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: 'Failed to recalculate',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bitly/recalculate
 * 
 * WHAT: Returns status information about the recalculation system.
 * WHY: Useful for health checks and monitoring.
 */
export async function GET(request: NextRequest) {
  // SECURITY (messmass#386): require an authenticated admin session.
  const __denied = await requireSession();
  if (__denied) return __denied;

  try {
    // Real status, not just "ready" (messmass#283). The two numbers an operator
    // actually needs before triggering a recalculation are how stale the data is
    // and whether anything is left to clean up.
    const db = await getDb();
    const [links, associations, newestSync] = await Promise.all([
      db.collection('bitly_links').countDocuments(),
      db.collection('bitly_project_links').countDocuments(),
      db.collection('bitly_links')
        .find({ lastSyncAt: { $exists: true } })
        .sort({ lastSyncAt: -1 })
        .limit(1)
        .project({ lastSyncAt: 1 })
        .toArray(),
    ]);

    // Orphan count, reported rather than silently waiting to be cleaned.
    // recalculateLinkRanges removes orphans for the links it touches, but an
    // untouched link keeps its dead rows, so an operator needs to see the
    // backlog without having to run a recalculation to discover it.
    const referencedProjectIds = await db
      .collection('bitly_project_links')
      .distinct('projectId');
    const livingCount = referencedProjectIds.length
      ? await db.collection('projects').countDocuments({ _id: { $in: referencedProjectIds } })
      : 0;
    const orphanedAssociations = referencedProjectIds.length
      ? await db.collection('bitly_project_links').countDocuments({
          projectId: {
            $nin: (
              await db
                .collection('projects')
                .find({ _id: { $in: referencedProjectIds } })
                .project({ _id: 1 })
                .toArray()
            ).map((p) => p._id),
          },
        })
      : 0;

    const lastSyncAt = newestSync[0]?.lastSyncAt ?? null;
    const staleAfterHours = 24;
    const isStale = lastSyncAt
      ? Date.now() - new Date(lastSyncAt).getTime() > staleAfterHours * 60 * 60 * 1000
      : true;

    return NextResponse.json({
      status: 'ready',
      modes: ['bitlink', 'project', 'all'],
      endpoint: '/api/bitly/recalculate',
      method: 'POST',
      links,
      associations,
      orphanedAssociations,
      deletedProjectsReferenced: referencedProjectIds.length - livingCount,
      lastSyncAt,
      // A link synced within the cadence is fresh; never-synced counts as stale
      // rather than unknown, because "unknown" is what got ignored before.
      isStale,
      staleAfterHours,
    });
  } catch (error) {
    logError('Recalculate API GET error', { context: 'bitly-recalculate' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
