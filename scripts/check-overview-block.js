const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function checkOverview() {
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('📊 Overview Data Block Configuration:\n');
    const overview = await db.collection('dataBlocks').findOne({ blockId: 'overview' });
    
    if (!overview) {
      console.log('❌ Overview block not found');
      return;
    }
    
    console.log(`Block: ${overview.title}`);
    console.log(`Order: ${overview.order}`);
    console.log(`Columns: ${overview.columns}`);
    console.log(`Active: ${overview.isActive}`);
    console.log(`\nCharts (${overview.charts?.length || 0}):\n`);
    
    if (overview.charts && overview.charts.length > 0) {
      overview.charts
        .sort((a, b) => a.order - b.order)
        .forEach((chart, i) => {
          console.log(`${i + 1}. ${chart.chartId}`);
          console.log(`   - Order: ${chart.order}`);
          console.log(`   - Width: ${chart.width} unit(s)`);
          console.log('');
        });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkOverview();
