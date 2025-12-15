// WHAT: Debug chart configurations to see what's missing
// WHY: Charts aren't showing names/formulas, need to investigate

const { MongoClient } = require('mongodb');

async function debugChartConfigs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Debugging Chart Configurations');
    console.log('=================================');
    
    // Get all chart configurations
    const charts = await db.collection('chart_configurations').find({}).limit(10).toArray();
    
    console.log(`Found ${charts.length} chart configurations`);
    
    charts.forEach((chart, i) => {
      console.log(`\nChart ${i + 1}:`);
      console.log(`   - _id: ${chart._id}`);
      console.log(`   - name: ${chart.name || 'MISSING'}`);
      console.log(`   - type: ${chart.type || 'MISSING'}`);
      console.log(`   - formula: ${chart.formula || 'MISSING'}`);
      console.log(`   - element: ${chart.element || 'MISSING'}`);
      console.log(`   - isActive: ${chart.isActive}`);
      console.log(`   - All keys: ${Object.keys(chart).join(', ')}`);
    });
    
    // Check if there are any with actual data
    const chartsWithNames = await db.collection('chart_configurations').find({
      name: { $exists: true, $ne: null, $ne: '' }
    }).limit(5).toArray();
    
    console.log(`\n📊 Charts with names: ${chartsWithNames.length}`);
    chartsWithNames.forEach((chart, i) => {
      console.log(`   ${i + 1}. ${chart.name} (${chart.type}) - Formula: ${chart.formula || 'None'}`);
    });
    
    // Check total count
    const totalCount = await db.collection('chart_configurations').countDocuments();
    const activeCount = await db.collection('chart_configurations').countDocuments({ isActive: true });
    const namedCount = await db.collection('chart_configurations').countDocuments({ 
      name: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Total charts: ${totalCount}`);
    console.log(`   - Active charts: ${activeCount}`);
    console.log(`   - Named charts: ${namedCount}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  debugChartConfigs().catch(console.error);
}

module.exports = { debugChartConfigs };