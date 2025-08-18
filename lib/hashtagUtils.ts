import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

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
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    await client.db(MONGODB_DB).admin().ping();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export interface HashtagSlug {
  _id?: string;
  hashtag: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate or retrieve UUID for a hashtag
 */
export async function getOrCreateHashtagSlug(hashtag: string): Promise<string> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('hashtag_slugs');

    // Check if hashtag already has a UUID
    const existing = await collection.findOne({ hashtag: hashtag.toLowerCase() });
    
    if (existing) {
      return existing.slug;
    }

    // Generate new UUID for hashtag
    const slug = uuidv4();
    const hashtagSlug = {
      hashtag,
      slug,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.insertOne(hashtagSlug);
    console.log(`✅ Created new hashtag slug: ${hashtag} -> ${slug}`);
    
    return slug;
  } catch (error) {
    console.error('❌ Failed to get/create hashtag slug:', error);
    throw error;
  }
}

/**
 * Get hashtag name from UUID
 */
export async function getHashtagFromSlug(slug: string): Promise<string | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('hashtag_slugs');

    const hashtagSlug = await collection.findOne({ slug });
    
    if (!hashtagSlug) {
      return null;
    }

    return hashtagSlug.hashtag;
  } catch (error) {
    console.error('❌ Failed to get hashtag from slug:', error);
    throw error;
  }
}

/**
 * Get all hashtags with their UUIDs for admin dashboard
 */
export async function getAllHashtagSlugs(): Promise<Array<{hashtag: string, slug: string, count: number}>> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    // Get all unique hashtags from projects
    const projects = await db.collection('projects').find({}, { 
      projection: { hashtags: 1 } 
    }).toArray();
    
    // Calculate hashtag counts
    const hashtagCounts: { [key: string]: number } = {};
    projects.forEach(project => {
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          hashtagCounts[hashtag.toLowerCase()] = (hashtagCounts[hashtag.toLowerCase()] || 0) + 1;
        });
      }
    });

    // Get or create UUIDs for all hashtags
    const hashtagsWithSlugs = [];
    for (const [hashtag, count] of Object.entries(hashtagCounts)) {
      const slug = await getOrCreateHashtagSlug(hashtag);
      hashtagsWithSlugs.push({ hashtag, slug, count });
    }

    // Sort by usage count (descending) and then alphabetically
    hashtagsWithSlugs.sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.hashtag.localeCompare(b.hashtag);
    });

    return hashtagsWithSlugs;
  } catch (error) {
    console.error('❌ Failed to get all hashtag slugs:', error);
    throw error;
  }
}

/**
 * Migration function to create UUIDs for existing hashtags
 */
export async function migrateExistingHashtags(): Promise<void> {
  try {
    console.log('🔄 Starting hashtag UUID migration...');
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    // Get all unique hashtags from projects
    const projects = await db.collection('projects').find({}, { 
      projection: { hashtags: 1 } 
    }).toArray();
    
    const uniqueHashtags = new Set<string>();
    projects.forEach(project => {
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          uniqueHashtags.add(hashtag.toLowerCase());
        });
      }
    });

    console.log(`📊 Found ${uniqueHashtags.size} unique hashtags to migrate`);

    // Create UUIDs for all hashtags
    for (const hashtag of uniqueHashtags) {
      await getOrCreateHashtagSlug(hashtag);
    }

    console.log('✅ Hashtag UUID migration completed');
  } catch (error) {
    console.error('❌ Hashtag migration failed:', error);
    throw error;
  }
}
