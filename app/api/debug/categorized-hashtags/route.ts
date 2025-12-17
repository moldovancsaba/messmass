import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import config from '@/lib/config';

const MONGODB_URI = process.env.MONGODB_URI || '';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    await client.db(config.dbName).admin().ping();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await connectToDatabase();
    const db = client.db(config.dbName);
    
    // Get projects that have categorizedHashtags field
    const projectsWithCategories = await db.collection('projects').find({
      categorizedHashtags: { $exists: true, $ne: {} }
    }, {
      projection: {
        eventName: 1,
        eventDate: 1,
        hashtags: 1,
        categorizedHashtags: 1,
        viewSlug: 1,
        createdAt: 1
      }
    }).limit(10).sort({ createdAt: -1 }).toArray();

    // Get projects with only traditional hashtags
    const projectsWithTraditional = await db.collection('projects').find({
      hashtags: { $exists: true, $ne: [] },
      $or: [
        { categorizedHashtags: { $exists: false } },
        { categorizedHashtags: {} }
      ]
    }, {
      projection: {
        eventName: 1,
        eventDate: 1,
        hashtags: 1,
        categorizedHashtags: 1,
        viewSlug: 1,
        createdAt: 1
      }
    }).limit(5).sort({ createdAt: -1 }).toArray();

    // Get total counts
    const totalWithCategorized = await db.collection('projects').countDocuments({
      categorizedHashtags: { $exists: true, $ne: {} }
    });

    const totalWithTraditional = await db.collection('projects').countDocuments({
      hashtags: { $exists: true, $ne: [] }
    });

    return NextResponse.json({
      success: true,
      data: {
        projectsWithCategories: projectsWithCategories.map(project => ({
          _id: project._id,
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {},
          viewSlug: project.viewSlug,
          createdAt: project.createdAt
        })),
        projectsWithTraditional: projectsWithTraditional.map(project => ({
          _id: project._id,
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {},
          viewSlug: project.viewSlug,
          createdAt: project.createdAt
        })),
        counts: {
          totalWithCategorized,
          totalWithTraditional,
          totalProjects: totalWithCategorized + totalWithTraditional
        }
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}
