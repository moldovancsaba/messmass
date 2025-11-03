// scripts/setup-content-assets-indexes.ts
// WHAT: Create MongoDB indexes for content_assets collection
// WHY: Optimize query performance for search, filter, and sort operations
// HOW: Run once after collection creation or when schema changes

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function setupContentAssetsIndexes() {
  // TypeScript knows MONGODB_URI is defined here because process.exit(1) above prevents execution
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('content_assets');
    
    console.log('\n📊 Setting up indexes for content_assets collection...\n');
    
    // WHAT: Unique index on slug field
    // WHY: Enforce slug uniqueness (primary identifier for asset references)
    // PERFORMANCE: Prevents duplicate slugs, enables O(1) lookups by slug
    console.log('1️⃣ Creating unique index on slug...');
    await collection.createIndex(
      { slug: 1 },
      { unique: true, name: 'slug_unique' }
    );
    console.log('   ✅ slug_unique index created');
    
    // WHAT: Index on type field
    // WHY: Enable fast filtering by asset type (image vs text)
    // QUERY: GET /api/content-assets?type=image
    console.log('2️⃣ Creating index on type...');
    await collection.createIndex(
      { type: 1 },
      { name: 'type_1' }
    );
    console.log('   ✅ type_1 index created');
    
    // WHAT: Index on category field
    // WHY: Enable fast filtering by category
    // QUERY: GET /api/content-assets?category=Partners
    console.log('3️⃣ Creating index on category...');
    await collection.createIndex(
      { category: 1 },
      { name: 'category_1' }
    );
    console.log('   ✅ category_1 index created');
    
    // WHAT: Index on tags array field
    // WHY: Enable fast filtering by tags (multikey index for array)
    // QUERY: GET /api/content-assets?tags=logo,2024
    console.log('4️⃣ Creating multikey index on tags...');
    await collection.createIndex(
      { tags: 1 },
      { name: 'tags_1' }
    );
    console.log('   ✅ tags_1 multikey index created');
    
    // WHAT: Index on createdAt field
    // WHY: Enable fast sorting by creation date (newest first)
    // QUERY: GET /api/content-assets?sortBy=createdAt&sortOrder=desc
    console.log('5️⃣ Creating index on createdAt...');
    await collection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_-1' }
    );
    console.log('   ✅ createdAt_-1 index created');
    
    // WHAT: Index on usageCount field
    // WHY: Enable fast sorting by usage count (most used first)
    // QUERY: GET /api/content-assets?sortBy=usageCount&sortOrder=desc
    console.log('6️⃣ Creating index on usageCount...');
    await collection.createIndex(
      { usageCount: -1 },
      { name: 'usageCount_-1' }
    );
    console.log('   ✅ usageCount_-1 index created');
    
    // WHAT: Text index on title and description fields
    // WHY: Enable full-text search across content metadata
    // QUERY: GET /api/content-assets?search=partner+logo
    console.log('7️⃣ Creating text index on title and description...');
    await collection.createIndex(
      {
        title: 'text',
        description: 'text',
        tags: 'text'
      },
      {
        name: 'text_search',
        weights: {
          title: 10,        // WHAT: Prioritize title matches (10x weight)
          tags: 5,          // WHAT: Tags are important (5x weight)
          description: 1    // WHAT: Description is secondary (1x weight)
        }
      }
    );
    console.log('   ✅ text_search index created');
    
    // WHAT: Compound index for common query patterns
    // WHY: Optimize filtered + sorted queries
    // QUERY: GET /api/content-assets?type=image&category=Partners&sortBy=createdAt
    console.log('8️⃣ Creating compound index (type + category + createdAt)...');
    await collection.createIndex(
      { type: 1, category: 1, createdAt: -1 },
      { name: 'type_category_created' }
    );
    console.log('   ✅ type_category_created compound index created');
    
    // Verify all indexes
    console.log('\n📋 Verifying indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log(`   ✅ Total indexes: ${indexes.length}`);
    
    console.log('\n📊 Index Details:');
    indexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. ${idx.name}:`, JSON.stringify(idx.key));
    });
    
    console.log('\n✅ Content Assets indexes setup complete!');
    console.log('\n📌 Index Summary:');
    console.log('   - Unique slug index for fast lookups and uniqueness enforcement');
    console.log('   - Type/category/tags indexes for filtering');
    console.log('   - CreatedAt/usageCount indexes for sorting');
    console.log('   - Full-text search index for title/description/tags');
    console.log('   - Compound index for complex queries');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// WHAT: Run index setup
// WHY: Execute when script is run directly
// USAGE: npm run setup:content-indexes
setupContentAssetsIndexes();
