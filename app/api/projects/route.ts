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

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

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

    // Defaults and caps
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Search mode: server-side search across full dataset (eventName; extendable later)
    if (q && q.trim() !== '') {
      const query = q.trim();
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const filter: any = {
        $or: [
          { eventName: { $regex: regex } },
          { viewSlug: { $regex: regex } },
          { editSlug: { $regex: regex } },
        ]
      };

      const totalMatched = await collection.countDocuments(filter);
      const offset = Math.max(Number(offsetParam) || 0, 0);

      const projects = await collection
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      const formatted = projects.map(project => ({
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

      const nextOffset = offset + projects.length;
      const hasMore = nextOffset < totalMatched;

      return NextResponse.json({
        success: true,
        projects: formatted,
        pagination: {
          mode: 'search',
          limit,
          offset,
          nextOffset: hasMore ? nextOffset : null,
          totalMatched
        }
      });
    }

    // Default list mode with cursor-based pagination
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