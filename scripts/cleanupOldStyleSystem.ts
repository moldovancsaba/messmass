#!/usr/bin/env npx tsx
/**
 * WHAT: Clean up old page style system from database
 * WHY: Remove deprecated pageStyles, hashtagStyles collections and old settings
 * HOW: Drop old collections and remove obsolete settings documents
 * 
 * IMPORTANT: Run this ONLY after verifying new page_styles_enhanced system works!
 */

import * as dotenv from 'dotenv';
import { getDb } from '../lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function cleanupOldStyleSystem() {
  console.log('🧹 Starting cleanup of old style system...\n');
  
  const db = await getDb();
  
  // Collections to remove
  const oldCollections = [
    'pageStyles',        // Old page styles collection
    'hashtagStyles',     // Old hashtag-to-style mapping
  ];
  
  // Check what exists
  const existingCollections = await db.listCollections().toArray();
  const existingNames = existingCollections.map((c: any) => c.name);
  
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
    const exists = await settingsCollection.findOne({ _id: settingId } as any);
    if (exists) {
      await settingsCollection.deleteOne({ _id: settingId } as any);
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
    const globalDefault = newStyles.find((s: any) => s.isGlobalDefault);
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
}

cleanupOldStyleSystem()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
