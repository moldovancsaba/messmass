import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';

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
    console.log('📊 Fetching hashtag slugs...');
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    // Get all projects to calculate hashtag counts
    const projectsCollection = db.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    
    console.log(`📊 Found ${projects.length} projects in database`);
    
    // Calculate hashtag counts from projects (including category-prefixed hashtags)
    const hashtagCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      // Get all hashtag representations for this project
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      
      // Count each hashtag representation
      allHashtagRepresentations.forEach((hashtag: string) => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      });
    });
    
    const uniqueHashtags = Object.keys(hashtagCounts);
    console.log(`🏷️ Found ${uniqueHashtags.length} unique hashtags:`, uniqueHashtags);
    
    // If no hashtags found, return empty array (not an error)
    if (uniqueHashtags.length === 0) {
      console.log('📝 No hashtags found in any projects, returning empty array');
      return NextResponse.json({
        success: true,
        hashtags: [],
        debug: {
          projectCount: projects.length,
          hashtagCount: 0,
          message: 'No hashtags found in projects'
        }
      });
    }
    
    // Get or create UUID slugs for each hashtag
    const hashtagSlugsCollection = db.collection('hashtag_slugs');
    const hashtagsWithSlugs = [];
    
    for (const [hashtag, count] of Object.entries(hashtagCounts)) {
      // Check if slug already exists for this hashtag
      let slugDoc = await hashtagSlugsCollection.findOne({ hashtag });
      
      if (!slugDoc) {
        // Create new UUID slug for this hashtag
        const newSlug = uuidv4();
        
        const newSlugDoc = {
          hashtag,
          slug: newSlug,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await hashtagSlugsCollection.insertOne(newSlugDoc);
        slugDoc = { _id: result.insertedId, ...newSlugDoc };
        console.log(`🆕 Created new UUID for #${hashtag}: ${newSlug}`);
      } else {
        console.log(`✅ Found existing UUID for #${hashtag}: ${slugDoc.slug}`);
      }
      
      hashtagsWithSlugs.push({
        hashtag,
        slug: slugDoc.slug,
        count
      });
    }
    
    // Sort by count descending
    hashtagsWithSlugs.sort((a, b) => b.count - a.count);
    console.log(`📋 Returning ${hashtagsWithSlugs.length} hashtags with slugs`);
    
    return NextResponse.json({
      success: true,
      hashtags: hashtagsWithSlugs
    });
    
  } catch (error) {
    console.error('Failed to fetch hashtag slugs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hashtag slugs'
    }, { status: 500 });
  }
}
