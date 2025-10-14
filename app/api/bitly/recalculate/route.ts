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
import {
  recalculateLinkRanges,
  recalculateProjectLinks,
  refreshAllCachedMetrics,
} from '@/lib/bitly-recalculator';

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

      console.log(
        `[Recalculate API] Mode=bitlink, ID=${body.bitlyLinkId}, Time=${timestamp}`
      );

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

      console.log(
        `[Recalculate API] Mode=project, ID=${body.projectId}, Time=${timestamp}`
      );

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
      console.log(`[Recalculate API] Mode=all (full refresh), Time=${timestamp}`);

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
    console.error('[Recalculate API] Error:', error);
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
  try {
    // TODO: Could add system status here (e.g., last sync time, stale associations count)
    return NextResponse.json({
      status: 'ready',
      modes: ['bitlink', 'project', 'all'],
      endpoint: '/api/bitly/recalculate',
      method: 'POST',
    });
  } catch (error) {
    console.error('[Recalculate API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
