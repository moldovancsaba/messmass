import { MongoClient } from 'mongodb';
import config from './config';

// WHAT: Use centralized config to resolve required MongoDB URI.
// WHY: Avoid scattered environment checks; single source of truth simplifies maintenance and security.
const uri = config.mongodbUri;
const options = {
  // MongoDB connection options optimized for Atlas
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

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Connection with retry logic
async function createConnection(): Promise<MongoClient> {
  try {
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

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createConnection();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = createConnection();
}

export default clientPromise;
