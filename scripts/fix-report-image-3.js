// Fix report-image-3 missing formula
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function fix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('=== Fixing report-image-3 formula ===\n');
    
    const result = await db.collection('chart_configurations').updateOne(
      { chartId: 'report-image-3' },
      { $set: { formula: 'stats.reportImage3' } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Fixed report-image-3 formula');
      console.log(`   Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    } else {
      console.log('❌ Chart report-image-3 not found');
    }
    
    // Verify fix
    const chart = await db.collection('chart_configurations')
      .findOne({ chartId: 'report-image-3' });
    
    console.log('\nVerification:');
    console.log(`Formula: ${chart?.formula}`);
    
  } finally {
    await client.close();
  }
}

fix().catch(console.error);
