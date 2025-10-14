/**
 * GET /api/bitly/project-metrics/[projectId]
 * 
 * WHAT: Fetches aggregated Bitly metrics for a specific project.
 * WHY: Provides filtered, cached analytics data for a single event/project,
 * considering temporal boundaries when links are shared across multiple events.
 * 
 * RETURNS:
 * - All Bitly links associated with this project
 * - Cached metrics filtered by date range for each link
 * - Date range boundaries (startDate/endDate) for transparency
 * 
 * USE CASES:
 * - Project detail page showing Bitly performance
 * - Analytics dashboards for specific events
 * - Exporting event-specific Bitly data
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import type { BitlyProjectLink } from '@/lib/bitly-junction.types';

/**
 * Response shape for project Bitly metrics
 */
interface ProjectBitlyMetricsResponse {
  projectId: string;
  links: Array<{
    bitlyLinkId: string;
    bitlink: string;
    title: string;
    longUrl: string;
    dateRange: {
      startDate: string | null;
      endDate: string | null;
      autoCalculated: boolean;
    };
    metrics: {
      clicks: number;
      uniqueClicks: number;
      topCountries: Array<{ country: string; clicks: number }>;
      topReferrers: Array<{ domain: string; clicks: number }>;
      deviceClicks: {
        mobile: number;
        desktop: number;
        tablet: number;
        other: number;
      };
      browserClicks: {
        chrome: number;
        firefox: number;
        safari: number;
        edge: number;
        other: number;
      };
      dailyClicks?: Array<{ date: string; clicks: number }>;
    };
    lastSyncedAt: string | null;
  }>;
  totalClicks: number;
  totalUniqueClicks: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Validate projectId format
    // WHY: Prevent invalid MongoDB queries
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      );
    }

    const projectObjectId = new ObjectId(projectId);
    const db = await getDb();

    // Check if project exists
    // WHY: Return 404 for non-existent projects
    const project = await db.collection('projects').findOne({ _id: projectObjectId });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch all junction table entries for this project
    // WHY: Each entry represents one Bitly link with cached metrics
    const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');
    const associations = await junctionCollection
      .find({ projectId: projectObjectId })
      .toArray();

    if (associations.length === 0) {
      // No Bitly links associated with this project
      return NextResponse.json({
        projectId,
        links: [],
        totalClicks: 0,
        totalUniqueClicks: 0,
      });
    }

    // Fetch bitly_links documents for display metadata
    // WHY: Need bitlink URL, title, long_url for UI display
    const bitlyLinkIds = associations.map((a) => a.bitlyLinkId);
    const bitlyLinksCollection = db.collection('bitly_links');
    const bitlyLinks = await bitlyLinksCollection
      .find({ _id: { $in: bitlyLinkIds } })
      .toArray();

    // Create lookup map for efficient joining
    const bitlyLinksMap = new Map(
      bitlyLinks.map((link) => [link._id.toString(), link])
    );

    // Build response with cached metrics and link metadata
    const links = associations.map((assoc) => {
      const bitlyLinkDoc = bitlyLinksMap.get(assoc.bitlyLinkId.toString());

      return {
        bitlyLinkId: assoc.bitlyLinkId.toString(),
        bitlink: bitlyLinkDoc?.bitlink || 'unknown',
        title: bitlyLinkDoc?.title || 'Untitled Link',
        longUrl: bitlyLinkDoc?.long_url || '',
        dateRange: {
          startDate: assoc.startDate,
          endDate: assoc.endDate,
          autoCalculated: assoc.autoCalculated,
        },
        metrics: {
          clicks: assoc.cachedMetrics.clicks,
          uniqueClicks: assoc.cachedMetrics.uniqueClicks,
          topCountries: assoc.cachedMetrics.topCountries,
          topReferrers: assoc.cachedMetrics.topReferrers,
          deviceClicks: assoc.cachedMetrics.deviceClicks,
          browserClicks: assoc.cachedMetrics.browserClicks,
          dailyClicks: assoc.cachedMetrics.dailyClicks,
        },
        lastSyncedAt: assoc.lastSyncedAt,
      };
    });

    // Calculate totals across all links
    // WHY: Useful for summary displays
    const totalClicks = links.reduce((sum, link) => sum + link.metrics.clicks, 0);
    const totalUniqueClicks = links.reduce(
      (sum, link) => sum + link.metrics.uniqueClicks,
      0
    );

    const response: ProjectBitlyMetricsResponse = {
      projectId,
      links,
      totalClicks,
      totalUniqueClicks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Bitly Project Metrics API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch project Bitly metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
