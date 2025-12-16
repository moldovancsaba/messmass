#!/usr/bin/env node

/**
 * WHAT: Migration script to add default aspect ratios to existing text charts
 * WHY: Text charts now support aspect ratios like image charts for better layout control
 * HOW: Find all text chart configurations and add default 16:9 aspect ratio if missing
 */

const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateTextChartAspectRatios() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    console.log('🔍 Finding text chart configurations without aspect ratios...');
    
    // Find all text chart configurations that don't have aspectRatio set
    const configurations = await collection.find({
      type: 'text',
      aspectRatio: { $exists: false }
    }).toArray();
    
    console.log(`📝 Found ${configurations.length} text chart configurations to migrate`);
    
    if (configurations.length === 0) {
      console.log('✅ No text chart configurations need migration');
      return;
    }
    
    let updatedCount = 0;
    
    for (const config of configurations) {
      console.log(`\n🔄 Processing: ${config.title} (${config.chartId})`);
      
      // Add default 16:9 aspect ratio for text charts
      const result = await collection.updateOne(
        { _id: config._id },
        { 
          $set: { 
            aspectRatio: '16:9', // Default to landscape for text content
            updatedAt: new Date().toISOString(),
            lastModifiedBy: 'migration-script'
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`  ✅ Added aspectRatio: '16:9'`);
      } else {
        console.log(`  ⚠️  Failed to update configuration`);
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`📝 Total text chart configurations processed: ${configurations.length}`);
    console.log(`✅ Configurations updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔗 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateTextChartAspectRatios().catch(console.error);
}

module.exports = { migrateTextChartAspectRatios };