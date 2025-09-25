import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, Db } from 'mongodb';
import { generateProjectSlugs } from '@/lib/slugUtils';
import clientPromise from '@/lib/mongodb';

// Import hashtag category types for categorized hashtags support
import { CategorizedHashtagMap } from '@/lib/hashtagCategoryTypes';
import { 
  mergeHashtagSystems, 
  expandHashtagsWithCategories,
  getAllHashtagRepresentations 
} from '@/lib/hashtagCategoryUtils';

// Define project interface for type safety
// Enhanced to support both traditional and categorized hashtags
interface ProjectDocument {
  _id?: ObjectId;
  hashtags?: string[];                    // Traditional hashtags (maintained for backward compatibility)
  categorizedHashtags?: CategorizedHashtagMap; // New field for category-hashtag mapping
  [key: string]: unknown;
}

// Hashtag cleanup utility function
async function cleanupUnusedHashtags(db: Db) {
  try {
    console.log('🧹 Starting hashtag cleanup...');
    
    const projectsCollection = db.collection('projects');
    const hashtagsCollection = db.collection('hashtags');
    
    // Get all hashtags currently used in projects
    // Enhanced to include both traditional and categorized hashtags
    const projects = await projectsCollection.find({}).toArray();
    const usedHashtags = new Set<string>();
    
    projects.forEach((project: ProjectDocument) => {
      // Add traditional hashtags (for backward compatibility)
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          usedHashtags.add(hashtag.toLowerCase());
        });
      }
      
      // Add categorized hashtags (new feature)
      if (project.categorizedHashtags) {
        Object.values(project.categorizedHashtags).forEach((categoryHashtags) => {
          if (Array.isArray(categoryHashtags)) {
            categoryHashtags.forEach((hashtag: string) => {
              usedHashtags.add(hashtag.toLowerCase());
            });
          }
        });
      }
    });
    
    // Delete hashtags that are no longer used
    const deleteResult = await hashtagsCollection.deleteMany({
      hashtag: { $not: { $in: Array.from(usedHashtags) } }
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} unused hashtags`);
    return deleteResult.deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup hashtags:', error);
    return 0;
  }
}

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

async function connectToDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const client = await clientPromise;
    
    // Test the connection
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB Atlas connected successfully');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

// GET /api/projects - Fetch projects with optional pagination and search
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');
    const q = url.searchParams.get('q');
    const offsetParam = url.searchParams.get('offset');

    // New: server-side sorting across the entire dataset
    // WHAT: Allow sorting by Event Name, Date, Images, Total Fans, Attendees
    // WHY: Clicking a table header in the admin UI must reorder ALL projects, not just the visible page
    const sortFieldParam = url.searchParams.get('sortField'); // 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees'
    const sortOrderParam = url.searchParams.get('sortOrder'); // 'asc' | 'desc'

    // Defaults and caps
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Normalize and validate sorting inputs
    const ALLOWED_FIELDS = new Set(['eventName', 'eventDate', 'images', 'fans', 'attendees']);
    const sortField = sortFieldParam && ALLOWED_FIELDS.has(sortFieldParam) ? sortFieldParam as 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' : null;
    const sortOrder = sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : null;

    // Decide pagination mode:
    // - If search (q) or explicit sort present -> use OFFSET pagination for global ordering
    // - Else -> keep existing CURSOR pagination by updatedAt desc (infinite scroll default)
    const isSearch = !!(q && q.trim() !== '');
    const isSorted = !!(sortField && sortOrder);

    if (isSearch || isSorted) {
      // OFFSET mode with aggregation to ensure full-dataset ordering
      const offset = Math.max(Number(offsetParam) || 0, 0);

      // Build $match (server-side search reuses existing criteria)
      const pipeline: any[] = [];
      if (isSearch) {
        const query = q!.trim();
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        pipeline.push({
          $match: {
            $or: [
              { eventName: { $regex: regex } },
              { viewSlug: { $regex: regex } },
              { editSlug: { $regex: regex } },
            ]
          }
        });
      }

      // Compute sort keys for numeric aggregations; use $convert for dates
      pipeline.push({
        $addFields: {
          _sortEventDate: { $convert: { input: "$eventDate", to: "date", onError: null, onNull: null } },
          _images: {
            $add: [
              { $ifNull: ["$stats.remoteImages", 0] },
              { $ifNull: ["$stats.hostessImages", 0] },
              { $ifNull: ["$stats.selfies", 0] }
            ]
          },
          _fans: {
            $add: [
              { $ifNull: ["$stats.indoor", 0] },
              { $ifNull: ["$stats.outdoor", 0] },
              { $ifNull: ["$stats.stadium", 0] }
            ]
          },
          _attendees: { $ifNull: ["$stats.eventAttendees", 0] }
        }
      });

      // Map sort field to computed keys, with deterministic tie-breaker
      const dir = sortOrder === 'asc' ? 1 : -1;
      const sortSpec: Record<string, 1 | -1> = {};
      if (sortField === 'eventName') {
        // Use natural field with case-insensitive collation applied at aggregate call
        sortSpec['eventName'] = dir;
      } else if (sortField === 'eventDate') {
        sortSpec['_sortEventDate'] = dir;
      } else if (sortField === 'images') {
        sortSpec['_images'] = dir;
      } else if (sortField === 'fans') {
        sortSpec['_fans'] = dir;
      } else if (sortField === 'attendees') {
        sortSpec['_attendees'] = dir;
      } else {
        // No explicit sort provided: fallback to updatedAt desc for search-only mode
        sortSpec['updatedAt'] = -1;
        sortSpec['_id'] = -1;
      }
      // Deterministic tie-breaker for stable pagination order
      if (!sortSpec['_id']) sortSpec['_id'] = 1;
      pipeline.push({ $sort: sortSpec });

      // Use $facet to paginate and count in a single round-trip
      pipeline.push({
        $facet: {
          results: [
            { $skip: offset },
            { $limit: limit },
            {
              $project: {
                _sortEventDate: 0,
                _images: 0,
                _fans: 0,
                _attendees: 0
              }
            }
          ],
          totalCount: [ { $count: 'count' } ]
        }
      });

      const aggOptions = sortField === 'eventName' ? { collation: { locale: 'en', strength: 2 } } : undefined;
      const agg = await collection.aggregate(pipeline, aggOptions as any).toArray();
      const first = agg[0] || { results: [], totalCount: [] };
      const results = first.results || [];
      const totalMatched = (first.totalCount?.[0]?.count as number) || 0;

      const formatted = results.map((project: any) => ({
        _id: project._id.toString(),
        eventName: project.eventName,
        eventDate: project.eventDate,
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {},
        stats: project.stats,
        viewSlug: project.viewSlug,
        editSlug: project.editSlug,
        styleId: project.styleId || null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }));

      const nextOffset = offset + formatted.length;
      const hasMore = nextOffset < totalMatched;

      return NextResponse.json({
        success: true,
        projects: formatted,
        pagination: {
          mode: isSearch ? 'search' : 'sort',
          limit,
          offset,
          nextOffset: hasMore ? nextOffset : null,
          totalMatched
        }
      });
    }

    // Default list mode with cursor-based pagination (no search, no explicit sort)
    // Cursor is a base64-encoded JSON: { u: updatedAt (ISO string), id: _id string }
    let filter: any = {};
    let sort = { updatedAt: -1 as const, _id: -1 as const };
    if (cursorParam) {
      try {
        const decoded = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf-8')) as { u: string; id: string };
        const u = decoded.u;
        const id = decoded.id;
        filter = {
          $or: [
            { updatedAt: { $lt: u } },
            { updatedAt: u, _id: { $lt: new ObjectId(id) } }
          ]
        };
      } catch {
        // Invalid cursor -> ignore and start from top
        filter = {};
      }
    }

    const projects = await collection
      .find(filter)
      .sort(sort)
      .limit(limit)
      .toArray();

    const formatted = projects.map(project => ({
      _id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],               // Traditional hashtags (backward compatibility)
      categorizedHashtags: project.categorizedHashtags || {}, // New categorized hashtags
      stats: project.stats,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      styleId: project.styleId || null,               // Project-specific style reference
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    let nextCursor: string | null = null;
    if (projects.length === limit) {
      const last = projects[projects.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ u: last.updatedAt, id: last._id.toString() }), 'utf-8').toString('base64');
    }

    return NextResponse.json({
      success: true,
      projects: formatted,
      pagination: {
        mode: 'cursor',
        limit,
        nextCursor
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch projects:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Enhanced to support both traditional and categorized hashtags + styleId
    const { eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId } = body;

    if (!eventName || !eventDate || !stats) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('💾 Creating new project:', eventName);

    // Generate unique slugs for the project
    console.log('🔑 Generating unique slugs...');
    const { viewSlug, editSlug } = await generateProjectSlugs();
    console.log('✅ Generated slugs:', { viewSlug: viewSlug.substring(0, 8) + '...', editSlug: editSlug.substring(0, 8) + '...' });

    // Validate styleId if provided
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
      
      // Validate that the style exists
      const pageStylesCollection = db.collection('pageStyles');
      const styleExists = await pageStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        return NextResponse.json(
          { success: false, error: 'Referenced style does not exist' },
          { status: 404 }
        );
      }
    }
    
    const collection = db.collection('projects');

    const now = new Date().toISOString();
    
    // Enhanced project structure to support categorized hashtags and styleId
    const project: any = {
      eventName,
      eventDate,
      hashtags: hashtags || [],                        // Traditional hashtags (backward compatibility)
      categorizedHashtags: categorizedHashtags || {},  // New categorized hashtags field
      stats,
      viewSlug,
      editSlug,
      createdAt: now,
      updatedAt: now
    };
    
    // Add styleId if provided
    if (styleId && styleId !== null && styleId !== 'null') {
      project.styleId = styleId;
    }

    // Enhanced hashtag processing to handle both traditional and categorized hashtags
    // Store both plain hashtags and category-prefixed versions for comprehensive filtering
    const allHashtagRepresentations = getAllHashtagRepresentations({
      hashtags,
      categorizedHashtags
    });
    
    if (allHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Process each hashtag representation individually to avoid conflicts
      for (const hashtagRepresentation of allHashtagRepresentations) {
        const normalizedHashtag = hashtagRepresentation.toLowerCase();
        
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag: normalizedHashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag: normalizedHashtag },
            { 
              $setOnInsert: { 
                hashtag: normalizedHashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      
      console.log(`✅ Updated hashtag counts for ${allHashtagRepresentations.length} hashtag representations (${hashtags.length} traditional, ${Object.keys(categorizedHashtags).length} categories)`);
    }

    const result = await collection.insertOne(project);
    console.log('✅ Project created with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      projectId: result.insertedId.toString(),
      project: {
        _id: result.insertedId.toString(),
        ...project
      }
    });

  } catch (error) {
    console.error('❌ Failed to create project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Update existing project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Enhanced to support both traditional and categorized hashtags + styleId
    const { projectId, eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId } = body;

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating project:', projectId, { styleId });

    // Validate styleId if provided
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // If styleId is provided, validate it exists in pageStyles collection
    if (styleId && styleId !== null && styleId !== 'null') {
      const pageStylesCollection = db.collection('pageStyles');
      const styleExists = await pageStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        return NextResponse.json(
          { success: false, error: 'Referenced style does not exist' },
          { status: 404 }
        );
      }
    }
    
    // Get the current project to compare hashtags
    const currentProject = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Enhanced update data to include categorized hashtags
    const setData: any = {
      eventName,
      eventDate,
      hashtags: hashtags || [],                        // Traditional hashtags (backward compatibility)
      categorizedHashtags: categorizedHashtags || {},  // New categorized hashtags field
      stats,
      updatedAt: new Date().toISOString()
    };
    
    // Handle styleId assignment/removal strategically
    let unsetData: any = {};
    
    if (styleId === null || styleId === 'null') {
      // Remove styleId to use global/default style
      unsetData.styleId = '';
    } else if (styleId && styleId !== undefined) {
      // Set specific styleId
      setData.styleId = styleId;
    }
    // If styleId is not provided in the request, don't modify existing styleId
    
    // Build the update operation object
    const updateOperation: any = { $set: setData };
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }
    
    // Enhanced hashtag change handling for both traditional and categorized hashtags
    // Use all hashtag representations (including category-prefixed versions)
    const currentAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: currentProject.hashtags || [],
      categorizedHashtags: currentProject.categorizedHashtags || {}
    }).map((h: string) => h.toLowerCase());
    
    const newAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: hashtags || [],
      categorizedHashtags: categorizedHashtags || {}
    }).map((h: string) => h.toLowerCase());
    
    const hashtagsCollection = db.collection('hashtags');
    const now = new Date().toISOString();
    
    // Hashtags to add (in new but not in current)
    const hashtagsToAdd = newAllHashtagRepresentations.filter((h: string) => !currentAllHashtagRepresentations.includes(h));
    // Hashtags to remove (in current but not in new)
    const hashtagsToRemove = currentAllHashtagRepresentations.filter((h: string) => !newAllHashtagRepresentations.includes(h));
    
    // Update hashtag counts
    if (hashtagsToAdd.length > 0) {
      // Process each hashtag individually to avoid conflicts
      for (const hashtag of hashtagsToAdd) {
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag },
            { 
              $setOnInsert: { 
                hashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      console.log(`✅ Added ${hashtagsToAdd.length} new hashtags`);
    }
    
    if (hashtagsToRemove.length > 0) {
      // Decrement count for removed hashtags
      for (const hashtag of hashtagsToRemove) {
        await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: -1 } }
        );
      }
      console.log(`✅ Decremented count for ${hashtagsToRemove.length} hashtags`);
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(projectId) },
      updateOperation
    );

    console.log('✅ Project updated successfully');
    
    // Clean up unused hashtags
    await cleanupUnusedHashtags(db);

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('❌ Failed to update project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update project' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting project:', projectId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // Get the project's hashtags before deletion
    const project = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Delete the project
    const result = await collection.deleteOne({ _id: new ObjectId(projectId) });

    console.log('✅ Project deleted successfully');
    
    // Enhanced hashtag cleanup for both traditional and categorized hashtags
    // Remove all hashtag representations (including category-prefixed versions)
    const allDeletedHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {}
    });
    
    if (allDeletedHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Decrement count for each hashtag representation
      for (const hashtagRepresentation of allDeletedHashtagRepresentations) {
        await hashtagsCollection.updateOne(
          { hashtag: hashtagRepresentation.toLowerCase() },
          { $inc: { count: -1 } }
        );
      }
      
      console.log(`✅ Decremented count for ${allDeletedHashtagRepresentations.length} hashtag representations (including categorized)`);
      
      // Clean up unused hashtags
      await cleanupUnusedHashtags(db);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Failed to delete project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete project' 
      },
      { status: 500 }
    );
  }
}