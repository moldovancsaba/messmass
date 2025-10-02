/**
 * MongoDB Index Creation Script
 * 
 * WHAT: Creates optimized indexes for MessMass collections
 * WHY: Improves query performance for frequently accessed fields
 * 
 * This script analyzes the actual query patterns from the API routes and creates
 * indexes to optimize:
 * - Project listing and sorting (updatedAt, eventName, eventDate)
 * - Hashtag filtering (both traditional and categorized)
 * - Slug-based lookups (viewSlug, editSlug)
 * - Search operations (eventName text search)
 * - Category management
 * 
 * USAGE: node scripts/create-indexes.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// WHAT: MongoDB connection configuration
// WHY: Use centralized environment variables for consistency
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

/**
 * Index definitions based on actual query patterns
 */
const INDEX_DEFINITIONS = {
  // Projects collection indexes
  projects: [
    {
      name: 'updatedAt_desc_id_desc',
      keys: { updatedAt: -1, _id: -1 },
      options: {},
      rationale: 'Default cursor pagination by most recently updated projects'
    },
    {
      name: 'eventDate_asc_id_asc',
      keys: { eventDate: 1, _id: 1 },
      options: {},
      rationale: 'Sort by event date (ascending) with deterministic tie-breaker'
    },
    {
      name: 'eventDate_desc_id_desc',
      keys: { eventDate: -1, _id: -1 },
      options: {},
      rationale: 'Sort by event date (descending) with deterministic tie-breaker'
    },
    {
      name: 'eventName_text',
      keys: { eventName: 'text', viewSlug: 'text', editSlug: 'text' },
      options: {},
      rationale: 'Full-text search for event names and slugs in admin dashboard'
    },
    {
      name: 'viewSlug_unique',
      keys: { viewSlug: 1 },
      options: { unique: true, sparse: true },
      rationale: 'Fast lookup for public stats pages by unique view slug'
    },
    {
      name: 'editSlug_unique',
      keys: { editSlug: 1 },
      options: { unique: true, sparse: true },
      rationale: 'Fast lookup for edit pages by unique edit slug'
    },
    {
      name: 'hashtags_multikey',
      keys: { hashtags: 1 },
      options: {},
      rationale: 'Multikey index for filtering by traditional hashtags (backward compatibility)'
    },
    {
      name: 'categorizedHashtags_wildcard',
      keys: { 'categorizedHashtags.$**': 1 },
      options: {},
      rationale: 'Wildcard index for filtering by category-specific hashtags (new system)'
    },
    {
      name: 'createdAt_desc',
      keys: { createdAt: -1 },
      options: {},
      rationale: 'Optional sorting by creation date for analytics'
    }
  ],

  // Hashtag categories collection indexes
  'hashtag-categories': [
    {
      name: 'name_unique',
      keys: { name: 1 },
      options: { unique: true },
      rationale: 'Ensure unique category names and fast category lookup'
    },
    {
      name: 'createdAt_desc',
      keys: { createdAt: -1 },
      options: {},
      rationale: 'Sort categories by creation date'
    }
  ]
};

/**
 * Creates indexes for a specific collection
 */
async function createCollectionIndexes(db, collectionName, indexes) {
  console.log(`\n📊 Processing collection: ${collectionName}`);
  
  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    console.log(`  ⚠️  Collection "${collectionName}" does not exist - skipping`);
    return { created: 0, skipped: indexes.length };
  }
  
  const collection = db.collection(collectionName);

  // Get existing indexes
  const existingIndexes = await collection.indexes();
  const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));

  let created = 0;
  let skipped = 0;

  for (const indexDef of indexes) {
    if (existingIndexNames.has(indexDef.name)) {
      console.log(`  ⏭️  Index "${indexDef.name}" already exists - skipping`);
      skipped++;
      continue;
    }

    try {
      await collection.createIndex(
        indexDef.keys,
        { ...indexDef.options, name: indexDef.name }
      );
      console.log(`  ✅ Created index "${indexDef.name}"`);
      console.log(`     Keys: ${JSON.stringify(indexDef.keys)}`);
      console.log(`     Rationale: ${indexDef.rationale}`);
      created++;
    } catch (error) {
      console.error(`  ❌ Failed to create index "${indexDef.name}":`, error.message);
    }
  }

  console.log(`\n  Summary: ${created} created, ${skipped} skipped`);
  return { created, skipped };
}

/**
 * Analyzes existing indexes and provides recommendations
 */
async function analyzeIndexes(db, collectionName) {
  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    return; // Skip analysis for non-existent collections
  }
  
  const collection = db.collection(collectionName);
  const indexes = await collection.indexes();
  
  // Use db.command for collection stats
  const stats = await db.command({ collStats: collectionName });

  console.log(`\n📈 Index Analysis for ${collectionName}:`);
  console.log(`   Documents: ${stats.count.toLocaleString()}`);
  console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Indexes: ${indexes.length}`);

  indexes.forEach((idx, i) => {
    const size = stats.indexSizes?.[idx.name] || 0;
    console.log(`   ${i + 1}. ${idx.name}: ${(size / 1024).toFixed(2)} KB`);
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 MessMass Database Index Optimization');
  console.log('========================================\n');
  console.log(`📍 Database: ${MONGODB_DB}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db(MONGODB_DB);

    // Track totals
    let totalCreated = 0;
    let totalSkipped = 0;

    // Create indexes for each collection
    for (const [collectionName, indexes] of Object.entries(INDEX_DEFINITIONS)) {
      const { created, skipped } = await createCollectionIndexes(db, collectionName, indexes);
      totalCreated += created;
      totalSkipped += skipped;

      // Analyze indexes after creation
      await analyzeIndexes(db, collectionName);
    }

    // Final summary
    console.log('\n========================================');
    console.log('📊 FINAL SUMMARY');
    console.log('========================================');
    console.log(`✅ Total indexes created: ${totalCreated}`);
    console.log(`⏭️  Total indexes skipped: ${totalSkipped}`);
    console.log('========================================\n');

    if (totalCreated > 0) {
      console.log('💡 Performance Improvements:');
      console.log('   • Faster project listing and pagination');
      console.log('   • Optimized hashtag filtering (both formats)');
      console.log('   • Improved slug-based lookups');
      console.log('   • Better search performance');
      console.log('   • Efficient category management');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
main().catch(console.error);
