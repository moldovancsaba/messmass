// WHAT: Migration script to add showTitle field to all existing data visualization blocks
// WHY: Ensures backward compatibility by setting showTitle: true for all existing blocks
// HOW: Updates MongoDB collection with the new field where it doesn't exist

import { getDb } from '../lib/db';

async function migrateShowTitleField() {
  console.log('Starting showTitle field migration...');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const db = await getDb();
    const collection = db.collection('data_visualization_blocks');
    
    // Count existing blocks without showTitle field
    const blocksToUpdate = await collection.countDocuments({
      showTitle: { $exists: false }
    });
    
    console.log(`Found ${blocksToUpdate} blocks without showTitle field`);
    
    if (blocksToUpdate === 0) {
      console.log('No blocks need migration. All blocks already have showTitle field.');
      process.exit(0);
    }
    
    // Update all existing blocks to have showTitle: true
    const result = await collection.updateMany(
      { showTitle: { $exists: false } },
      { 
        $set: { 
          showTitle: true, 
          updatedAt: new Date().toISOString() 
        } 
      }
    );
    
    console.log(`✓ Migration complete: ${result.modifiedCount} blocks updated`);
    console.log(`  - Matched: ${result.matchedCount}`);
    console.log(`  - Modified: ${result.modifiedCount}`);
    
    // Verify the migration
    const verifyCount = await collection.countDocuments({
      showTitle: { $exists: true }
    });
    const totalCount = await collection.countDocuments({});
    
    console.log(`\nVerification:`);
    console.log(`  - Total blocks: ${totalCount}`);
    console.log(`  - Blocks with showTitle: ${verifyCount}`);
    
    if (verifyCount === totalCount) {
      console.log('  ✓ All blocks now have showTitle field');
    } else {
      console.warn('  ⚠ Warning: Some blocks may still be missing showTitle field');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute migration
migrateShowTitleField();
