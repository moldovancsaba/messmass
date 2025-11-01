const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function listCharts() {
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('📊 All Chart Configurations:\n');
    const charts = await db.collection('chartConfigurations').find({}).toArray();
    
    if (charts.length === 0) {
      console.log('❌ No charts found in database');
      return;
    }
    
    charts.forEach((chart, i) => {
      console.log(`${i + 1}. ${chart.chartId}`);
      console.log(`   - Title: ${chart.title}`);
      console.log(`   - Type: ${chart.type}`);
      console.log(`   - Active: ${chart.isActive}`);
      console.log(`   - Order: ${chart.order}`);
      console.log('');
    });
    
    console.log(`Total: ${charts.length} charts`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

listCharts();
