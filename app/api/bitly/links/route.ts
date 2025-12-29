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
import { error as logError, info as logInfo } from '@/lib/logger';

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
      logError('Failed to fetch link from Bitly API', { context: 'bitly-links', normalized }, error instanceof Error ? error : new Error(String(error)));
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
      logInfo('Link exists, creating junction association', { context: 'bitly-links', bitlink: normalized, projectId: projectObjectId.toString() });
      
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
        logError('Failed to create association', { context: 'bitly-links', bitlink: normalized, projectId: projectObjectId.toString() }, error instanceof Error ? error : new Error(String(error)));
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
        logInfo('Created junction association for new link', { context: 'bitly-links', bitlink: normalized, projectId: projectObjectId.toString() });
      } catch (error) {
        logError('Failed to create association for new link', { context: 'bitly-links', bitlink: normalized, projectId: projectObjectId.toString() }, error instanceof Error ? error : new Error(String(error)));
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
    logError('POST /api/bitly/links error', { context: 'bitly-links' }, error instanceof Error ? error : new Error(String(error)));
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
 * WHAT: List Bitly links with optional filtering and sorting
 * WHY: Enables admin UI to display links and their associations with user-controlled ordering
 * 
 * AUTH: Admin only
 * QUERY PARAMS:
 *   - search: Search term (filters by bitlink, long_url, or title)
 *   - projectId: Filter links by project (omit to get all links)
 *   - includeAnalytics: Include analytics data (default: false)
 *   - includeUnassigned: Include links with no projectId (default: false)
 *   - favorite: Filter by favorite status (default: false)
 *   - limit: Pagination limit (default: 50)
 *   - offset: Pagination offset (default: 0)
 *   - sortField: Field to sort by (bitlink | title | clicks | lastSyncAt)
 *   - sortOrder: Sort direction (asc | desc)
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
    const searchQuery = searchParams.get('search');
    const projectId = searchParams.get('projectId');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const includeUnassigned = searchParams.get('includeUnassigned') === 'true';
    const favorite = searchParams.get('favorite');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder');

    // WHAT: Build query filter
    // WHY: Supports multiple use cases (all links, project links, unassigned links, search)
    const filter: any = { archived: { $ne: true } }; // Exclude archived by default

    // WHAT: Add search filter if search query provided
    // WHY: Allow users to search through 3000+ links by bitlink, URL, or title
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
      filter.$or = [
        { bitlink: searchRegex },
        { long_url: searchRegex },
        { title: searchRegex }
      ];
    }

    // WHAT: Add favorite filter if requested
    // WHY: Allow admins to filter and show only favorited links
    if (favorite === 'true') {
      filter.favorite = true;
    }

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

    // WHAT: Build sort options
    // WHY: Support user-controlled sorting by multiple fields
    let sortOptions: any = { updatedAt: -1 }; // Default sort
    
    if (sortField && sortOrder) {
      const order = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'bitlink':
          sortOptions = { bitlink: order };
          break;
        case 'title':
          sortOptions = { title: order };
          break;
        case 'clicks':
          // WHAT: Sort by total clicks from summary
          // WHY: Allows admins to find high-performing links quickly
          sortOptions = { 'click_summary.total': order };
          break;
        case 'lastSyncAt':
          sortOptions = { lastSyncAt: order };
          break;
        default:
          // Keep default sort if invalid field provided
          break;
      }
    }

    // WHAT: Query database with pagination and sorting
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const links = await db
      .collection('bitly_links')
      .find(filter)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .toArray();

    // WHAT: Count total matching documents for pagination
    const total = await db.collection('bitly_links').countDocuments(filter);
    
    // WHAT: Fetch associations from junction table for each link
    // WHY: Display which projects are connected to each Bitly link (many-to-many)
    const linksWithAssociations = await Promise.all(
      links.map(async (link) => {
        const associations = await db
          .collection('bitly_project_links')
          .aggregate([
            {
              $match: { bitlyLinkId: link._id }
            },
            {
              $lookup: {
                from: 'projects',
                localField: 'projectId',
                foreignField: '_id',
                as: 'project'
              }
            },
            {
              $unwind: { path: '$project', preserveNullAndEmptyArrays: true }
            },
            {
              $project: {
                projectId: { $toString: '$projectId' },
                projectName: '$project.eventName',
                startDate: 1,
                endDate: 1,
                autoCalculated: 1,
                clicks: '$cachedMetrics.clicks',
                lastSyncedAt: '$updatedAt'
              }
            }
          ])
          .toArray();
        
        // WHAT: Perform inverse lookup to find partners where bitlyLinkIds contains this link's _id
        // WHY: Enable display of partner associations in UI (bidirectional relationship)
        const associatedPartners = await db
          .collection('partners')
          .find({ bitlyLinkIds: link._id })
          .project({ _id: 1, name: 1, emoji: 1 })
          .toArray();
        
        return {
          ...link,
          associations,
          associatedPartners: associatedPartners.map(p => ({
            _id: p._id.toString(),
            name: p.name,
            emoji: p.emoji || '🤝'
          }))
        };
      })
    );

    // WHAT: Optionally strip analytics data to reduce payload size
    // WHY: List views don't need full timeseries; saves bandwidth
    const responseLinks = includeAnalytics
      ? linksWithAssociations
      : linksWithAssociations.map(link => ({
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
