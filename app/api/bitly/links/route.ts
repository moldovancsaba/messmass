// app/api/bitly/links/route.ts
// WHAT: API endpoints for managing Bitly link associations with MessMass projects
// WHY: Enables admins to connect Bitly URLs to events for analytics tracking
// ENDPOINTS:
//   POST - Associate a new Bitly link with a project
//   GET - List Bitly links (all or filtered by projectId)

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getLink, normalizeBitlink } from '@/lib/bitly';
import { mapBitlyLinkToDoc } from '@/lib/bitly-mappers';
import type { AssociateLinkInput, BitlyLinkResponse } from '@/lib/bitly-db.types';
import { createLinkAssociation } from '@/lib/bitly-recalculator';

/**
 * POST /api/bitly/links
 * WHAT: Associate a Bitly link with a MessMass project
 * WHY: Enables tracking link performance within project analytics
 * 
 * AUTH: Admin only
 * BODY: { projectId: string, bitlinkOrLongUrl: string, title?: string, tags?: string[] }
 * 
 * SCENARIOS:
 * 1. Associate existing Bitly link with project (projectId provided)
 * 2. Import unassigned Bitly link (projectId = null)
 * 3. Reassign link from one project to another (handled by PUT endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can associate links with projects
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse and validate request body
    const body = await request.json() as AssociateLinkInput;
    const { projectId, bitlinkOrLongUrl, title, tags } = body;

    if (!bitlinkOrLongUrl) {
      return NextResponse.json(
        { success: false, error: 'bitlinkOrLongUrl is required' },
        { status: 400 }
      );
    }

    // WHAT: Validate projectId if provided
    // WHY: Ensure project exists before associating link
    let projectObjectId: ObjectId | null = null;
    if (projectId) {
      if (!ObjectId.isValid(projectId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid projectId format' },
          { status: 400 }
        );
      }

      const client = await clientPromise;
      const db = client.db(config.dbName);
      const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
      
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      projectObjectId = new ObjectId(projectId);
    }

    // WHAT: Normalize bitlink format and fetch metadata from Bitly
    // WHY: Ensures consistent storage format and validates link exists
    const normalized = normalizeBitlink(bitlinkOrLongUrl);
    
    let bitlyMetadata;
    try {
      bitlyMetadata = await getLink(normalized);
    } catch (error) {
      console.error('[Bitly API] Failed to fetch link:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch link from Bitly. Ensure the link exists and is accessible.' 
        },
        { status: 400 }
      );
    }

    // WHAT: Check if this bitlink already exists in database
    // WHY: Support many-to-many - create junction entry if link exists
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const existingLink = await db.collection('bitly_links').findOne({ bitlink: normalized });

    if (existingLink && projectObjectId) {
      // WHAT: Link already exists - create junction table association
      // WHY: Many-to-many support - same link can be used by multiple events
      console.log(`[Bitly Links API] Link exists, creating junction association`);
      
      try {
        const association = await createLinkAssociation({
          bitlyLinkId: existingLink._id as ObjectId,
          projectId: projectObjectId,
          autoCalculated: true,
        });
        
        return NextResponse.json({
          success: true,
          link: existingLink,
          association,
          message: 'Bitly link associated with project (many-to-many)',
        });
      } catch (error) {
        console.error('[Bitly Links API] Failed to create association:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to create association'
          },
          { status: 500 }
        );
      }
    }

    // WHAT: Map Bitly metadata to MongoDB document structure (no projectId - using junction table)
    // WHY: Transforms API response to our database schema without deprecated projectId field
    const linkDoc = mapBitlyLinkToDoc(null, bitlyMetadata, title);

    // WHAT: Override tags if provided in request
    // WHY: Allows admin to add custom tags beyond Bitly's tags
    if (tags && tags.length > 0) {
      linkDoc.tags = [...(linkDoc.tags || []), ...tags];
    }

    // WHAT: Insert link document into database
    // WHY: Persists the link metadata (association via junction table)
    const now = new Date().toISOString();
    const insertResult = await db.collection('bitly_links').insertOne({
      ...linkDoc,
      createdAt: now,
      updatedAt: now,
    });

    // WHAT: Create junction table association if project specified
    // WHY: Many-to-many relationship via junction table
    let association = null;
    if (projectObjectId) {
      try {
        association = await createLinkAssociation({
          bitlyLinkId: insertResult.insertedId,
          projectId: projectObjectId,
          autoCalculated: true,
        });
        console.log(`[Bitly Links API] Created junction association for new link`);
      } catch (error) {
        console.error('[Bitly Links API] Failed to create association:', error);
        // Link created but association failed - log and continue
      }
    }

    // WHAT: Fetch the inserted document to return to client
    const insertedLink = await db.collection('bitly_links').findOne({ _id: insertResult.insertedId });

    return NextResponse.json({
      success: true,
      link: insertedLink,
      association,
      message: projectObjectId 
        ? 'Bitly link successfully associated with project (many-to-many)' 
        : 'Bitly link imported (unassigned)',
    });

  } catch (error) {
    console.error('[POST /api/bitly/links] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bitly/links
 * WHAT: List Bitly links with optional filtering
 * WHY: Enables admin UI to display links and their associations
 * 
 * AUTH: Admin only
 * QUERY PARAMS:
 *   - projectId: Filter links by project (omit to get all links)
 *   - includeAnalytics: Include analytics data (default: false)
 *   - includeUnassigned: Include links with no projectId (default: false)
 *   - limit: Pagination limit (default: 50)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Link data is sensitive; only admins can view
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const includeUnassigned = searchParams.get('includeUnassigned') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // WHAT: Build query filter
    // WHY: Supports multiple use cases (all links, project links, unassigned links)
    const filter: any = { archived: { $ne: true } }; // Exclude archived by default

    if (projectId) {
      // WHAT: Filter by specific project
      if (!ObjectId.isValid(projectId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid projectId format' },
          { status: 400 }
        );
      }
      filter.projectId = new ObjectId(projectId);
    } else if (!includeUnassigned) {
      // WHAT: Exclude unassigned links unless explicitly requested
      // WHY: Default behavior shows only assigned links
      filter.projectId = { $ne: null };
    }

    // WHAT: Query database with pagination
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const links = await db
      .collection('bitly_links')
      .find(filter)
      .sort({ updatedAt: -1 }) // Most recently updated first
      .skip(offset)
      .limit(limit)
      .toArray();

    // WHAT: Count total matching documents for pagination
    const total = await db.collection('bitly_links').countDocuments(filter);

    // WHAT: Optionally strip analytics data to reduce payload size
    // WHY: List views don't need full timeseries; saves bandwidth
    const responseLinks = includeAnalytics
      ? links
      : links.map(link => ({
          ...link,
          clicks_timeseries: undefined, // Remove timeseries
          geo: { countries: [], cities: [] }, // Remove geo details
          referrers: [], // Remove referrer details
        }));

    return NextResponse.json({
      success: true,
      links: responseLinks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('[GET /api/bitly/links] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
