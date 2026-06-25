import mongoose from 'mongoose';
import config from './config';

/**
 * MONGODB_URI is required for V3 Mongoose connection.
 * We reuse the existing mongodbUri from config.
 */
/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and across function invocations in serverless environments.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectV3() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = config.mongodbUri;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside lib/config.ts');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    };

    console.log('📡 Connecting to MongoDB V3 via Mongoose...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Mongoose V3 Connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectV3;
