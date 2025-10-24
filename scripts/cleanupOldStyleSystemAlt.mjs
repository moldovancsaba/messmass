#!/usr/bin/env node
/**
 * WHAT: Clean up old page style system from database (alternative version)
 * WHY: Remove deprecated pageStyles, hashtagStyles collections and old settings
 * HOW: Uses native ES modules with dotenv preload to avoid timing issues
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables BEFORE anything else
config({ path: resolve(__dirname, '../.env.local') });

async function cleanupOldStyleSystem() {
  console.log('🧹 Starting cleanup of old style system...\n');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not found in .env.local');
    process.exit(1);
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // Collections to remove
    const oldCollections = [
      'pageStyles',        // Old page styles collection
      'hashtagStyles',     // Old hashtag-to-style mapping
    ];
    
    // Check what exists
    const collections = await db.listCollections().toArray();
    const existingNames = collections.map(c => c.name);
    
    console.log('📋 Checking old collections...\n');
    
    for (const collectionName of oldCollections) {
      if (existingNames.includes(collectionName)) {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  ⚠️  Found "${collectionName}" with ${count} documents`);
        
        // Drop the collection
        await db.collection(collectionName).drop();
        console.log(`  ✅ Dropped "${collectionName}"`);
      } else {
        console.log(`  ✅ "${collectionName}" does not exist (already clean)`);
      }
    }
    
    // Clean up old settings documents
    console.log('\n📋 Checking old settings...\n');
    
    const settingsCollection = db.collection('settings');
    const oldSettingIds = ['globalStyle', 'adminStyle', 'filterStyle'];
    
    for (const settingId of oldSettingIds) {
      const exists = await settingsCollection.findOne({ _id: settingId });
      if (exists) {
        await settingsCollection.deleteOne({ _id: settingId });
        console.log(`  ✅ Removed old setting: "${settingId}"`);
      } else {
        console.log(`  ✅ Setting "${settingId}" does not exist (already clean)`);
      }
    }
    
    // Verify new system
    console.log('\n📋 Verifying new page_styles_enhanced system...\n');
    
    const newStyles = await db.collection('page_styles_enhanced').find({}).toArray();
    console.log(`  ✅ Found ${newStyles.length} styles in page_styles_enhanced`);
    
    if (newStyles.length === 0) {
      console.log('\n  ⚠️  WARNING: No styles in new system!');
      console.log('  💡 Run: npm run seed:page-styles');
    } else {
      const globalDefault = newStyles.find(s => s.isGlobalDefault);
      if (globalDefault) {
        console.log(`  ✅ Global default: "${globalDefault.name}"`);
      } else {
        console.log('  ⚠️  No global default set');
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your stats pages - old styles should be gone');
    console.log('   2. Only styles from /admin/design → Page Styles tab will appear');
    console.log('   3. If no styles exist, run: npm run seed:page-styles');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🎉 All done!');
  }
}

cleanupOldStyleSystem();
