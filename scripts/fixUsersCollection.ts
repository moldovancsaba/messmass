#!/usr/bin/env ts-node

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixUsersCollection() {
  console.log('🔍 Checking users collection state...\n');

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);

    // List all collections with 'user' in the name
    const collections = await db.listCollections().toArray();
    const userCollections = collections.filter(c => c.name.includes('user'));

    console.log('📊 User-related collections found:');
    for (const col of userCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }

    const hasUsers = userCollections.some(c => c.name === 'users');
    const hasLocalUsers = userCollections.some(c => c.name === 'local_users');

    console.log('\n' + '═'.repeat(60));

    if (hasLocalUsers && hasUsers) {
      console.log('⚠️  PROBLEM: Both collections exist!');
      console.log('\n🔧 Dropping "local_users" (incorrect name)...');
      await db.collection('local_users').drop();
      console.log('✅ Dropped local_users');
      console.log('✅ Only "users" collection remains\n');
    } else if (hasLocalUsers && !hasUsers) {
      console.log('🔄 Renaming "local_users" → "users"...');
      await db.collection('local_users').rename('users');
      console.log('✅ Renamed successfully\n');
    } else if (hasUsers && !hasLocalUsers) {
      console.log('✅ Collection correctly named "users" - no action needed\n');
    } else {
      console.log('⚠️  No users collection found!\n');
    }

    console.log('═'.repeat(60));
    console.log('\n✅ Fix complete - your login should work now!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUsersCollection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
