#!/usr/bin/env tsx
/**
 * WHAT: Check page styles database state and auto-fix global default
 * WHY: Diagnose dual style system issue and ensure at least one global default exists
 * HOW: Query both old and new collections, set first style as global default if needed
 */

import * as dotenv from 'dotenv';
import { getDb } from '../lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkStyles() {
  console.log('🔍 Checking page styles database state...\n');
  
  const db = await getDb();
  
  // Check new system (page_styles_enhanced)
  const newStyles = await db.collection('page_styles_enhanced').find({}).toArray();
  console.log('📊 Page Styles Enhanced (NEW SYSTEM - used by admin UI):');
  if (newStyles.length === 0) {
    console.log('  ⚠️  No styles found! Run: npm run seed:page-styles');
  } else {
    newStyles.forEach((s: any) => {
      console.log(`  - "${s.name}" (ID: ${s._id}) ${s.isGlobalDefault ? '⭐ GLOBAL DEFAULT' : ''}`);
    });
  }
  
  // Check old system (pageStyles)
  const oldStyles = await db.collection('pageStyles').find({}).toArray();
  console.log('\n📊 Page Styles (OLD SYSTEM - deprecated):');
  if (oldStyles.length === 0) {
    console.log('  ✅ No old styles (clean state)');
  } else {
    oldStyles.forEach((s: any) => {
      console.log(`  - "${s.name}" (ID: ${s._id})`);
    });
  }
  
  // Auto-fix: Ensure at least one global default exists in new system
  if (newStyles.length > 0 && !newStyles.some((s: any) => s.isGlobalDefault)) {
    console.log('\n⚠️  No global default set in new system!');
    console.log(`   Setting "${newStyles[0].name}" as global default...`);
    
    await db.collection('page_styles_enhanced').updateOne(
      { _id: newStyles[0]._id },
      { 
        $set: { 
          isGlobalDefault: true,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    console.log(`   ✅ Set "${newStyles[0].name}" as global default`);
  } else if (newStyles.length > 0) {
    const globalDefault = newStyles.find((s: any) => s.isGlobalDefault);
    if (globalDefault) {
      console.log(`\n✅ Global default is set: "${globalDefault.name}"`);
    }
  }
  
  console.log('\n✅ Check complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. The page-config API now reads from page_styles_enhanced collection');
  console.log('   2. Refresh your stats page to see the updated style');
  console.log('   3. Old "KARATE" and "system default" styles should no longer appear');
}

checkStyles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
