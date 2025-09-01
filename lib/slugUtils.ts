import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { CategorizedHashtagMap } from './hashtagCategoryTypes';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Project interface matching the database schema
interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[]; // Array of hashtag strings
  categorizedHashtags?: CategorizedHashtagMap; // Categorized hashtags
  stats: {
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitWeb?: number;
    visitFacebook?: number;
    visitInstagram?: number;
    visitYoutube?: number;
    visitTiktok?: number;
    visitX?: number;
    visitTrustpilot?: number;
    eventAttendees?: number;
    eventTicketPurchases?: number;
    eventResultHome?: number;
    eventResultVisitor?: number;
    eventValuePropositionVisited?: number;
    eventValuePropositionPurchases?: number;
  };
  viewSlug?: string;
  editSlug?: string;
  createdAt: string;
  updatedAt: string;
}

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

/**
 * Generate a unique UUID-based slug
 */
function generateSlug(): string {
  return uuidv4();
}

/**
 * Check if a slug already exists in the database
 */
async function isSlugUnique(slug: string): Promise<boolean> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    const existingProject = await collection.findOne({
      $or: [
        { viewSlug: slug },
        { editSlug: slug }
      ]
    });

    return existingProject === null;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return false;
  }
}

/**
 * Generate a unique view slug for client read-only access
 */
export async function generateUniqueViewSlug(): Promise<string> {
  let slug = generateSlug();
  let isUnique = await isSlugUnique(slug);

  // Regenerate if not unique (very unlikely with UUIDs)
  while (!isUnique) {
    slug = generateSlug();
    isUnique = await isSlugUnique(slug);
  }

  return slug;
}

/**
 * Generate a unique edit slug for editor access
 */
export async function generateUniqueEditSlug(): Promise<string> {
  let slug = generateSlug();
  let isUnique = await isSlugUnique(slug);

  // Regenerate if not unique (very unlikely with UUIDs)
  while (!isUnique) {
    slug = generateSlug();
    isUnique = await isSlugUnique(slug);
  }

  return slug;
}

/**
 * Generate both view and edit slugs for a new project
 */
export async function generateProjectSlugs(): Promise<{
  viewSlug: string;
  editSlug: string;
}> {
  const [viewSlug, editSlug] = await Promise.all([
    generateUniqueViewSlug(),
    generateUniqueEditSlug()
  ]);

  return { viewSlug, editSlug };
}

/**
 * Find a project by its view slug
 */
export async function findProjectByViewSlug(viewSlug: string): Promise<Project | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    const project = await collection.findOne({ viewSlug });
    
    if (project) {
      return {
        ...project,
        _id: project._id.toString()
      } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding project by view slug:', error);
    throw error;
  }
}

/**
 * Find a project by its edit slug
 */
export async function findProjectByEditSlug(editSlug: string): Promise<Project | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    const project = await collection.findOne({ editSlug });
    
    if (project) {
      return {
        ...project,
        _id: project._id.toString()
      } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding project by edit slug:', error);
    throw error;
  }
}

// Filter interface for saved filter combinations
interface FilterCombination {
  _id?: string;
  slug: string;
  hashtags: string[];
  createdAt: string;
  lastAccessed: string;
}

/**
 * Generate and save a filter slug for a hashtag combination
 */
export async function generateFilterSlug(hashtags: string[]): Promise<string> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('filter_slugs');

    // Normalize hashtags (lowercase, sorted)
    const normalizedHashtags = hashtags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0)
      .sort();

    if (normalizedHashtags.length === 0) {
      throw new Error('No valid hashtags provided');
    }

    // Check if this combination already exists
    const existingFilter = await collection.findOne({
      hashtags: { $eq: normalizedHashtags }
    });

    if (existingFilter) {
      // Update last accessed time and return existing slug
      await collection.updateOne(
        { _id: existingFilter._id },
        { $set: { lastAccessed: new Date().toISOString() } }
      );
      return existingFilter.slug;
    }

    // Generate new slug
    let slug = generateSlug();
    let isUnique = false;
    
    while (!isUnique) {
      const existingSlug = await collection.findOne({ slug });
      if (!existingSlug) {
        isUnique = true;
      } else {
        slug = generateSlug();
      }
    }

    // Save new filter combination
    const now = new Date().toISOString();
    await collection.insertOne({
      slug,
      hashtags: normalizedHashtags,
      createdAt: now,
      lastAccessed: now
    });

    return slug;
  } catch (error) {
    console.error('Error generating filter slug:', error);
    throw error;
  }
}

/**
 * Find hashtags by filter slug
 */
export async function findHashtagsByFilterSlug(filterSlug: string): Promise<string[] | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('filter_slugs');

    const filter = await collection.findOne({ slug: filterSlug });
    
    if (filter) {
      // Update last accessed time
      await collection.updateOne(
        { _id: filter._id },
        { $set: { lastAccessed: new Date().toISOString() } }
      );
      return filter.hashtags;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding hashtags by filter slug:', error);
    throw error;
  }
}
