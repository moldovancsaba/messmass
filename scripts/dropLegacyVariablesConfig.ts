#!/usr/bin/env ts-node

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function dropLegacyVariablesConfig() {
  console.log('🗑️  Dropping Legacy Variables Config Collection\n');
  console.log('═'.repeat(60));

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);

    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const hasVariablesConfig = collections.some(c => c.name === 'variablesConfig');
    const hasVariablesMetadata = collections.some(c => c.name === 'variables_metadata');

    console.log('📊 Current State:');
    console.log(`   - variablesConfig (legacy): ${hasVariablesConfig ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   - variables_metadata (modern v7.0.0+): ${hasVariablesMetadata ? 'EXISTS' : 'NOT FOUND'}\n`);

    if (!hasVariablesConfig) {
      console.log('✅ Legacy collection already removed - no action needed\n');
      return;
    }

    if (!hasVariablesMetadata) {
      console.log('⚠️  Warning: Modern variables_metadata collection not found!');
      console.log('   Cannot safely drop legacy collection.\n');
      return;
    }

    // Get counts
    const legacyCount = await db.collection('variablesConfig').countDocuments();
    const modernCount = await db.collection('variables_metadata').countDocuments();

    console.log('📈 Document Counts:');
    console.log(`   - variablesConfig: ${legacyCount} variables`);
    console.log(`   - variables_metadata: ${modernCount} variables\n`);

    console.log('ℹ️  Analysis:');
    console.log('   - Legacy collection uses raw names (e.g., "female", "genAlpha")');
    console.log('   - Modern collection uses stats.* prefix (e.g., "stats.female")');
    console.log('   - Modern system is Single Source of Truth (v7.0.0+)\n');

    console.log('🗑️  Dropping variablesConfig...');
    await db.collection('variablesConfig').drop();
    console.log('✅ Dropped successfully\n');

    console.log('═'.repeat(60));
    console.log('✅ PHASE 4 COMPLETE\n');
    console.log('📊 Result:');
    console.log('   - Legacy variablesConfig removed');
    console.log('   - variables_metadata is now the only variable system');
    console.log('   - Single Source of Truth established\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

dropLegacyVariablesConfig().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
