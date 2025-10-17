// scripts/delete-all-charts.js
// CRITICAL: Delete all chart configurations from production
// WHY: Strategic reset - rebuild after TheSportsDB integration
// BACKUP: scripts/backups/charts-backup-1760634927773.json

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deleteAllCharts() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('⚠️  CRITICAL OPERATION: Deleting all charts\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('messmass');
    const col = db.collection('chartConfigurations');

    // Count before deletion
    const countBefore = await col.countDocuments();
    console.log(`📊 Charts in database: ${countBefore}`);
    console.log(`💾 Backup file: scripts/backups/charts-backup-1760634927773.json\n`);
    
    console.log('🗑️  Executing deletion...\n');
    
    // Delete all charts
    const result = await col.deleteMany({});
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ DELETION COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Charts deleted: ${result.deletedCount}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════\n');
    
    // Verify collection is empty
    const countAfter = await col.countDocuments();
    if (countAfter === 0) {
      console.log('✅ Verification: chartConfigurations collection is now empty');
    } else {
      console.error(`⚠️  Warning: ${countAfter} charts remain in collection`);
    }
    
    console.log('\n📌 Next Steps:');
    console.log('   1. Implement TheSportsDB API integration');
    console.log('   2. Enrich Partner data with sports club info');
    console.log('   3. Plan chart system with enriched data');
    console.log('   4. Rebuild charts with proper metrics\n');

  } catch (err) {
    console.error('❌ Deletion failed:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Database connection closed');
    }
  }
}

deleteAllCharts();
