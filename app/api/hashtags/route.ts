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
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(offsetParam) || 0, 0);
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);

    // Pipeline to extract and count hashtags from both formats, then sort
    const pipeline: any[] = [
      {
        $project: {
          allTags: {
            $setUnion: [
              { $ifNull: ["$hashtags", []] },
              {
                $reduce: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  initialValue: [],
                  in: { $concatArrays: ["$$value", { $ifNull: ["$$this.v", []] }] }
                }
              }
            ]
          }
        }
      },
      { $unwind: "$allTags" },
      { $group: { _id: "$allTags", count: { $sum: 1 } } },
    ];

    if (search) {
      pipeline.push({ $match: { _id: { $regex: new RegExp(search, 'i') } } });
    }

    pipeline.push({ $sort: { count: -1, _id: 1 } });

    // Count total matched for search pagination summary
    const totalMatchedAgg = await db.collection('projects').aggregate([...pipeline, { $count: "total" }]).toArray();
    const totalMatched = totalMatchedAgg[0]?.total || 0;

    // Page slice
    pipeline.push({ $skip: offset });
    pipeline.push({ $limit: limit });

    const results = await db.collection('projects').aggregate(pipeline).toArray();
    const hashtags = results.map((r: any) => r._id);

    return NextResponse.json({
      success: true,
      hashtags,
      pagination: {
        mode: 'aggregation',
        limit,
        offset,
        nextOffset: offset + results.length < totalMatched ? offset + results.length : null,
        totalMatched
      }
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
