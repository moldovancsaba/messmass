import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, Db } from 'mongodb';
import { generateProjectSlugs } from '@/lib/slugUtils';
import clientPromise from '@/lib/mongodb';

// Define project interface for type safety
interface ProjectDocument {
  _id?: ObjectId;
  hashtags?: string[];
  [key: string]: unknown;
}

// Hashtag cleanup utility function
async function cleanupUnusedHashtags(db: Db) {
  try {
    console.log('🧹 Starting hashtag cleanup...');
    
    const projectsCollection = db.collection('projects');
    const hashtagsCollection = db.collection('hashtags');
    
    // Get all hashtags currently used in projects
    const projects = await projectsCollection.find({}).toArray();
    const usedHashtags = new Set<string>();
    
    projects.forEach((project: ProjectDocument) => {
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          usedHashtags.add(hashtag.toLowerCase());
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

// GET /api/projects - Fetch all projects
export async function GET() {
  try {
    console.log('📊 Fetching projects from database...');
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Get collection stats for debugging
    const stats = await collection.estimatedDocumentCount();
    console.log(`📈 Collection has ${stats} documents`);

    const projects = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    console.log(`✅ Found ${projects.length} projects`);

    const formattedProjects = projects.map(project => ({
      _id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],
      stats: project.stats,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      debug: {
        databaseName: MONGODB_DB,
        collectionCount: stats,
        projectsFound: projects.length
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch projects:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
      debug: {
        databaseName: MONGODB_DB,
        mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, eventDate, hashtags = [], stats } = body;

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

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    const now = new Date().toISOString();
    const project = {
      eventName,
      eventDate,
      hashtags: hashtags || [],
      stats,
      viewSlug,
      editSlug,
      createdAt: now,
      updatedAt: now
    };

    // Add hashtags to the hashtags collection if they don't exist
    if (hashtags && hashtags.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Process each hashtag individually to avoid conflicts
      for (const hashtag of hashtags) {
        const normalizedHashtag = hashtag.toLowerCase();
        
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
      
      console.log(`✅ Updated hashtag counts for ${hashtags.length} hashtags`);
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
    const { projectId, eventName, eventDate, hashtags = [], stats } = body;

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating project:', projectId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // Get the current project to compare hashtags
    const currentProject = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const updateData = {
      eventName,
      eventDate,
      hashtags: hashtags || [],
      stats,
      updatedAt: new Date().toISOString()
    };
    
    // Handle hashtag changes
    const currentHashtags = (currentProject.hashtags || []).map((h: string) => h.toLowerCase());
    const newHashtags = (hashtags || []).map((h: string) => h.toLowerCase());
    
    const hashtagsCollection = db.collection('hashtags');
    const now = new Date().toISOString();
    
    // Hashtags to add (in new but not in current)
    const hashtagsToAdd = newHashtags.filter((h: string) => !currentHashtags.includes(h));
    // Hashtags to remove (in current but not in new)
    const hashtagsToRemove = currentHashtags.filter((h: string) => !newHashtags.includes(h));
    
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
      { $set: updateData }
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
    
    // Decrement hashtag counts and clean up unused hashtags
    if (project.hashtags && project.hashtags.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Decrement count for each hashtag
      for (const hashtag of project.hashtags) {
        await hashtagsCollection.updateOne(
          { hashtag: hashtag.toLowerCase() },
          { $inc: { count: -1 } }
        );
      }
      
      console.log(`✅ Decremented count for ${project.hashtags.length} hashtags`);
      
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