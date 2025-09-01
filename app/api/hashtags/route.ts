import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Test the connection
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB Atlas connected successfully');
    
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    // Get all unique hashtags from projects (both old and new format)
    const projects = await db.collection('projects').find({}, { 
      projection: { hashtags: 1, categorizedHashtags: 1 } 
    }).toArray();
    
    // Extract all hashtags and count usage
    const hashtagCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      // Handle old format hashtags (general hashtags)
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      }
      
      // Handle new format categorized hashtags
      if (project.categorizedHashtags && typeof project.categorizedHashtags === 'object') {
        Object.values(project.categorizedHashtags).forEach((categoryHashtags: any) => {
          if (Array.isArray(categoryHashtags)) {
            categoryHashtags.forEach((hashtag: string) => {
              hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
            });
          }
        });
      }
    });
    
    // Convert to array and filter by search term
    let hashtags = Object.keys(hashtagCounts).map(hashtag => ({
      hashtag,
      count: hashtagCounts[hashtag]
    }));
    
    if (search) {
      hashtags = hashtags.filter(item => 
        item.hashtag.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort by usage count (descending) and then alphabetically
    hashtags.sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.hashtag.localeCompare(b.hashtag);
    });
    
    return NextResponse.json({
      success: true,
      hashtags: hashtags.map(item => item.hashtag)
    });
    
  } catch (error) {
    console.error('Hashtags API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hashtags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hashtag } = await request.json();
    
    if (!hashtag || typeof hashtag !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid hashtag is required' },
        { status: 400 }
      );
    }
    
    // Clean hashtag (remove # if present, lowercase, trim)
    const cleanedHashtag = hashtag.replace(/^#/, '').toLowerCase().trim();
    
    if (!cleanedHashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag cannot be empty' },
        { status: 400 }
      );
    }
    
    // Validate hashtag format (alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(cleanedHashtag)) {
      return NextResponse.json(
        { success: false, error: 'Hashtag can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      hashtag: cleanedHashtag
    });
    
  } catch (error) {
    console.error('Hashtag validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate hashtag' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag');
    
    if (!hashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag parameter is required' },
        { status: 400 }
      );
    }
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    // Check if hashtag is still being used in either format
    const projectsUsingHashtagOld = await db.collection('projects').countDocuments({
      hashtags: hashtag
    });
    
    const projectsUsingHashtagCategorized = await db.collection('projects').countDocuments({
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                cond: { $in: [hashtag, "$$this.v"] }
              }
            }
          },
          0
        ]
      }
    });
    
    const projectsUsingHashtag = projectsUsingHashtagOld + projectsUsingHashtagCategorized;
    
    if (projectsUsingHashtag > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete hashtag that is still in use' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Hashtag cleanup verified'
    });
    
  } catch (error) {
    console.error('Hashtag cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup hashtag' },
      { status: 500 }
    );
  }
}
