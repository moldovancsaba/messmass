#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB Atlas connection to help diagnose issues.
 * Run with: node scripts/test-mongo-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  console.log('🔍 Testing MongoDB Atlas connection...');
  console.log('📍 URI format check:', process.env.MONGODB_URI.substring(0, 20) + '...');

  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 1,
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
  };

  let client;
  try {
    console.log('🔌 Attempting to connect...');
    client = new MongoClient(process.env.MONGODB_URI, options);
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database access
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    console.log('🗄️ Testing database access...');
    
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    // Test a simple query
    const projectsCollection = db.collection('projects');
    const count = await projectsCollection.countDocuments();
    console.log('📊 Projects count:', count);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed. Check your internet connection.');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Authentication failed. Check your MongoDB credentials.');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('💡 SSL/TLS error. This might be a Node.js/OpenSSL compatibility issue.');
      console.log('💡 Try updating Node.js or using a different TLS configuration.');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Connection timeout. Check your network or MongoDB Atlas network access.');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Connection closed');
    }
  }
}

// Run the test
testConnection();
