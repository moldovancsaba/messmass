import { MongoClient } from 'mongodb';
import config from './config';

// WHAT: MongoDB connection options optimized for Atlas
// WHY: Centralized configuration for consistent connection behavior
function getConnectionOptions() {
  return {
    serverSelectionTimeoutMS: 15000, // Increased timeout
    connectTimeoutMS: 15000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverApi: {
      version: '1' as const,
      strict: true,
      deprecationErrors: true,
    },
    retryReads: true,
    retryWrites: true,
  };
}

// WHAT: Cached client promise for singleton pattern
// WHY: Reuse connection across requests
let cachedClientPromise: Promise<MongoClient> | null = null;

function createMissingMongoMockClient(): MongoClient {
  return {
    db() {
      throw new Error('MONGODB_URI environment variable is not configured');
    },
    close() {
      return Promise.resolve();
    },
  } as unknown as MongoClient;
}

// WHAT: Connection with retry logic
// WHY: Lazy URI validation - only validate when actually connecting (not at module load)
// HOW: Access config.mongodbUri inside function to defer validation until runtime
async function createConnection(): Promise<MongoClient> {
  try {
    // WHAT: Safely access MongoDB URI
    // WHY: Config validation happens here (lazy)
    let uri: string;
    try {
      uri = config.mongodbUri;
    } catch (error) {
      // WHAT: Config validation failed (missing/invalid MONGODB_URI)
      // WHY: Next imports DB-backed API modules during build/page-data collection.
      // HOW: Defer the hard failure until code actually tries to call client.db().
      return createMissingMongoMockClient();
    }
    
    // WHAT: Validate URI format before attempting connection
    // WHY: Provide clear error message for misconfigured environments
    if (!uri) {
      return createMissingMongoMockClient();
    }

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      // WHY: Runtime requires valid URI format - fail with helpful message
      throw new Error(
        `Invalid MongoDB URI format. Expected connection string to start with "mongodb://" or "mongodb+srv://". ` +
        `Got: ${uri ? uri.substring(0, 20) + '...' : 'undefined'}. ` +
        `Please check your MONGODB_URI environment variable.`
      );
    }
    
    const options = getConnectionOptions();
    const newClient = new MongoClient(uri, options);
    await newClient.connect();
    
    // Test the connection
    await newClient.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected successfully');
    
    return newClient;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// WHAT: Lazy connection getter
// WHY: Defer connection until actually needed (not at module import time)
// HOW: Create promise only when clientPromise is accessed
function getClientPromise(): Promise<MongoClient> {
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = createConnection();
    }
    cachedClientPromise = globalWithMongo._mongoClientPromise;
  } else {
    cachedClientPromise = createConnection();
  }

  return cachedClientPromise;
}

// WHAT: Default export as getter function
// WHY: Allows lazy initialization on first access
export default getClientPromise();
