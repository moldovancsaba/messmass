import { MongoClient, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { CategorizedHashtagMap } from './hashtagCategoryTypes';

const MONGODB_URI = process.env.MONGODB_URI || '';
import config from './config';
const MONGODB_DB = config.dbName;

// Project interface matching the database schema
interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[]; // Array of hashtag strings
  categorizedHashtags?: CategorizedHashtagMap; // Categorized hashtags
  partner1?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  partner2?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
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
 * Find a project by its view slug (UUID only)
 * WHAT: Populates partner1 and partner2 data from partner references
 * WHY: Stats pages need partner logos and emojis for hero display
 * SECURITY: Only accepts MongoDB ObjectId format (no viewSlug field)
 */
export async function findProjectByViewSlug(viewSlug: string): Promise<Project | null> {
  try {
    // WHAT: Validate UUID format (MongoDB ObjectId)
    // WHY: Prevent slug-based URL guessing attacks
    if (!ObjectId.isValid(viewSlug)) {
      console.log('❌ Invalid ObjectId format:', viewSlug);
      return null;
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // WHAT: Find by _id only (UUID-based security)
    // WHY: Enforce UUID-only URLs to prevent URL guessing attacks
    const project = await collection.findOne({ _id: new ObjectId(viewSlug) });
    
    if (!project) {
      return null;
    }

    // WHAT: Populate partner data if partner IDs exist
    // WHY: Frontend needs partner logos and emojis for display
    const partnersCollection = db.collection('partners');
    const partnerIds = [
      (project as any).partner1Id,
      (project as any).partner2Id
    ]
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    const partnersData = partnerIds.length > 0
      ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
      : [];
    
    const partnersMap = new Map(
      partnersData.map(p => [p._id.toString(), p])
    );

    const result: any = {
      ...project,
      _id: project._id.toString()
    };

    // Add partner1 data if available
    if ((project as any).partner1Id) {
      const partner1 = partnersMap.get((project as any).partner1Id.toString());
      if (partner1) {
        result.partner1 = {
          _id: partner1._id.toString(),
          name: partner1.name,
          emoji: partner1.emoji,
          logoUrl: partner1.logoUrl
        };
      }
    }

    // Add partner2 data if available
    if ((project as any).partner2Id) {
      const partner2 = partnersMap.get((project as any).partner2Id.toString());
      if (partner2) {
        result.partner2 = {
          _id: partner2._id.toString(),
          name: partner2.name,
          emoji: partner2.emoji,
          logoUrl: partner2.logoUrl
        };
      }
    }
    
    return result as Project;
  } catch (error) {
    console.error('Error finding project by view slug:', error);
    throw error;
  }
}

/**
 * Find a project by its edit slug (UUID only)
 * WHAT: Populates partner1 and partner2 data from partner references
 * WHY: Edit pages need partner logos and emojis for hero display
 * SECURITY: Only accepts MongoDB ObjectId format (no editSlug field)
 */
export async function findProjectByEditSlug(editSlug: string): Promise<Project | null> {
  try {
    // WHAT: Validate UUID format (MongoDB ObjectId)
    // WHY: Prevent slug-based URL guessing attacks
    if (!ObjectId.isValid(editSlug)) {
      console.log('❌ Invalid ObjectId format:', editSlug);
      return null;
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // WHAT: Find by _id only (UUID-based security)
    // WHY: Enforce UUID-only URLs to prevent URL guessing attacks
    const project = await collection.findOne({ _id: new ObjectId(editSlug) });
    
    if (!project) {
      return null;
    }

    // WHAT: Populate partner data if partner IDs exist
    // WHY: Frontend needs partner logos and emojis for display
    const partnersCollection = db.collection('partners');
    const partnerIds = [
      (project as any).partner1Id,
      (project as any).partner2Id
    ]
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    const partnersData = partnerIds.length > 0
      ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
      : [];
    
    const partnersMap = new Map(
      partnersData.map(p => [p._id.toString(), p])
    );

    const result: any = {
      ...project,
      _id: project._id.toString()
    };

    // Add partner1 data if available
    if ((project as any).partner1Id) {
      const partner1 = partnersMap.get((project as any).partner1Id.toString());
      if (partner1) {
        result.partner1 = {
          _id: partner1._id.toString(),
          name: partner1.name,
          emoji: partner1.emoji,
          logoUrl: partner1.logoUrl
        };
      }
    }

    // Add partner2 data if available
    if ((project as any).partner2Id) {
      const partner2 = partnersMap.get((project as any).partner2Id.toString());
      if (partner2) {
        result.partner2 = {
          _id: partner2._id.toString(),
          name: partner2.name,
          emoji: partner2.emoji,
          logoUrl: partner2.logoUrl
        };
      }
    }
    
    return result as Project;
  } catch (error) {
    console.error('Error finding project by edit slug:', error);
    throw error;
  }
}

// Filter interface for saved filter combinations (DB document)
interface FilterCombinationDoc {
  _id?: ObjectId;
  slug: string;
  hashtags: string[];
  styleId?: string | null; // Optional explicit style for this filter
  createdAt: string;
  lastAccessed: string;
}

/**
 * Generate and save a filter slug for a hashtag combination
 */
export async function generateFilterSlug(hashtags: string[], styleId?: string | null): Promise<string> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection<FilterCombinationDoc>('filter_slugs');

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
      // Update last accessed time and (optionally) update styleId if a new one was provided
      const updates: any = { lastAccessed: new Date().toISOString() };
      if (typeof styleId !== 'undefined') {
        // Persist explicit style choice for this combination so it is remembered
        updates.styleId = styleId && styleId !== 'null' ? styleId : null;
      }
      await collection.updateOne(
        { _id: (existingFilter as any)._id },
        { $set: updates }
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
      styleId: styleId && styleId !== 'null' ? styleId : null,
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
export async function findHashtagsByFilterSlug(filterSlug: string): Promise<{ hashtags: string[]; styleId?: string | null } | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection<FilterCombinationDoc>('filter_slugs');

    const filter = await collection.findOne({ slug: filterSlug });
    
    if (filter) {
      // Update last accessed time
      await collection.updateOne(
        { _id: (filter as any)._id },
        { $set: { lastAccessed: new Date().toISOString() } }
      );
      return { hashtags: filter.hashtags, styleId: filter.styleId };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding hashtags by filter slug:', error);
    throw error;
  }
}
