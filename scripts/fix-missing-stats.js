// scripts/fix-missing-stats.js
// WHAT: Initialize missing stats objects for partners
// WHY: Partners without stats objects can't have reportText fields, causing chart/data issues
// HOW: Add empty stats object to partners that don't have one

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixMissingStats() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');
    
    // Find partners without stats object
    const partnersWithoutStats = await partnersCollection.find({
      $or: [
        { stats: { $exists: false } },
        { stats: null }
      ]
    }).toArray();
    
    console.log(`Found ${partnersWithoutStats.length} partners without stats object\n`);
    
    if (partnersWithoutStats.length === 0) {
      console.log('✅ No partners need fixing!');
      return;
    }
    
    let fixed = 0;
    let skipped = 0;
    
    for (const partner of partnersWithoutStats) {
      try {
        const result = await partnersCollection.updateOne(
          { _id: partner._id },
          { 
            $set: { 
              stats: {},
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          fixed++;
          console.log(`  ✅ Fixed: ${partner.name} (${partner._id.toString().substring(0, 8)}...)`);
        } else {
          skipped++;
          console.log(`  ⚠️  Skipped: ${partner.name} (${partner._id.toString().substring(0, 8)}...)`);
        }
      } catch (error) {
        console.error(`  ❌ Error fixing ${partner.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✅ Fixed: ${fixed}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);
    console.log(`  📝 Total processed: ${partnersWithoutStats.length}`);
    
    // Verify fix
    const remainingWithoutStats = await partnersCollection.countDocuments({
      $or: [
        { stats: { $exists: false } },
        { stats: null }
      ]
    });
    
    console.log(`\n✅ Verification: ${remainingWithoutStats} partners still without stats`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run with confirmation
console.log('⚠️  This script will initialize empty stats objects for partners that don\'t have them.');
console.log('   This is safe and will not overwrite existing stats.\n');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  fixMissingStats();
}, 3000);

