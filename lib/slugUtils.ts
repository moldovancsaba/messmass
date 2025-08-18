import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Project interface matching the database schema
interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
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
