// scripts/addViewSlugToPartners.ts
// WHAT: Add viewSlug to all existing partners that don't have one
// WHY: Partner report pages require unique viewSlug for public sharing
// HOW: Query partners without viewSlug, generate unique slugs using generateUniqueViewSlug

import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { generateUniquePartnerViewSlug } from '../lib/partnerIdentifier';

async function addViewSlugToPartners() {
  console.log('🚀 Starting partner viewSlug migration...');
  
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const partnersCollection = db.collection('partners');
    
    // WHAT: Find all partners without viewSlug
    // WHY: Only update partners that need it (idempotent migration)
    const partnersWithoutSlug = await partnersCollection.find({
      $or: [
        { viewSlug: { $exists: false } },
        { viewSlug: null },
        { viewSlug: '' }
      ]
    }).toArray();
    
    console.log(`📊 Found ${partnersWithoutSlug.length} partners without viewSlug`);
    
    if (partnersWithoutSlug.length === 0) {
      console.log('✅ All partners already have viewSlug. Migration not needed.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // WHAT: Update each partner with unique viewSlug
    // WHY: Use the same slug generation logic as the API (ensures uniqueness)
    for (const partner of partnersWithoutSlug) {
      try {
        // Generate unique viewSlug using existing utility
        const viewSlug = await generateUniquePartnerViewSlug(db as any);
        
        // Update partner document
        await partnersCollection.updateOne(
          { _id: partner._id },
          { 
            $set: { 
              viewSlug,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        
        console.log(`✓ Updated partner "${partner.name}" (${partner._id}) with viewSlug: ${viewSlug}`);
        successCount++;
        
      } catch (error) {
        console.error(`✗ Failed to update partner "${partner.name}" (${partner._id}):`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Total partners processed: ${partnersWithoutSlug.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Partner report buttons will now work for all partners.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addViewSlugToPartners()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
