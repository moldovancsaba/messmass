// WHAT: Check the actual structure of chart configurations
// WHY: Need to understand how charts are structured to debug rendering

const { MongoClient } = require('mongodb');

async function checkChartStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Checking Chart Structure');
    console.log('===========================');
    
    // Get a few different types of charts
    const pieChart = await db.collection('chart_configurations').findOne({ type: 'pie' });
    const kpiChart = await db.collection('chart_configurations').findOne({ type: 'kpi' });
    const barChart = await db.collection('chart_configurations').findOne({ type: 'bar' });
    
    console.log('\n📊 PIE CHART STRUCTURE:');
    console.log(JSON.stringify(pieChart, null, 2));
    
    console.log('\n📈 KPI CHART STRUCTURE:');
    console.log(JSON.stringify(kpiChart, null, 2));
    
    console.log('\n📊 BAR CHART STRUCTURE:');
    console.log(JSON.stringify(barChart, null, 2));
    
    // Check if there are any charts that work on hashtag pages
    console.log('\n🔍 Looking for charts with meaningful data...');
    const meaningfulCharts = await db.collection('chart_configurations').find({
      $and: [
        { isActive: true },
        { elements: { $exists: true, $ne: null, $not: { $size: 0 } } }
      ]
    }).limit(3).toArray();
    
    console.log(`\nFound ${meaningfulCharts.length} charts with elements:`);
    meaningfulCharts.forEach((chart, i) => {
      console.log(`\nChart ${i + 1}: ${chart.title || 'Untitled'}`);
      console.log(`   - Type: ${chart.type}`);
      console.log(`   - Elements: ${chart.elements?.length || 0}`);
      if (chart.elements && chart.elements.length > 0) {
        chart.elements.slice(0, 2).forEach((element, j) => {
          console.log(`   - Element ${j + 1}:`);
          console.log(`     - Label: ${element.label || 'No label'}`);
          console.log(`     - Formula: ${element.formula || 'No formula'}`);
          console.log(`     - Color: ${element.color || 'No color'}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  checkChartStructure().catch(console.error);
}

module.exports = { checkChartStructure };