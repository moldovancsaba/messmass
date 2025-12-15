require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function fixChartActiveStatus() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔧 Fixing chart active status...');
    
    // Find charts without isActive field
    const chartsWithoutActive = await db.collection('chart_configurations').find({ 
      isActive: { $exists: false } 
    }).toArray();
    
    console.log(`Found ${chartsWithoutActive.length} charts without isActive field`);
    
    if (chartsWithoutActive.length > 0) {
      // Set all charts without isActive to true (active by default)
      const result = await db.collection('chart_configurations').updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true, updatedAt: new Date().toISOString() } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} charts to be active`);
    }
    
    // Specifically check SIHF charts
    const sihfCharts = ['report-image-1', 'report-image-2', 'unique-users', 'total-fans-engaged', 'engagement-rate'];
    
    console.log('\nChecking SIHF charts:');
    for (const chartId of sihfCharts) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      if (chart) {
        console.log(`  ${chartId}: isActive = ${chart.isActive}`);
        
        if (chart.isActive !== true) {
          await db.collection('chart_configurations').updateOne(
            { chartId },
            { $set: { isActive: true, updatedAt: new Date().toISOString() } }
          );
          console.log(`    ✅ Set ${chartId} to active`);
        }
      } else {
        console.log(`  ❌ ${chartId}: NOT FOUND`);
      }
    }
    
  } finally {
    await client.close();
  }
}

fixChartActiveStatus().catch(console.error);