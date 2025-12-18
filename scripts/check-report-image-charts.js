// Check report image chart configurations
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('=== Checking Report Image Charts ===\n');
    
    const charts = await db.collection('chart_configurations')
      .find({ chartId: { $in: ['report-image-1', 'report-image-2', 'report-image-3'] } })
      .toArray();
    
    console.log(`Found ${charts.length} charts:\n`);
    charts.forEach(chart => {
      console.log(`Chart ID: ${chart.chartId}`);
      console.log(`Title: ${chart.title}`);
      console.log(`Type: ${chart.type}`);
      console.log(`Formula: ${chart.formula}`);
      console.log(`Active: ${chart.isActive}`);
      console.log('---');
    });
    
    // Check a sample partner with report images
    console.log('\n=== Checking Sample Partner ===\n');
    const partner = await db.collection('partners').findOne({ 
      stats: { $exists: true }
    }, {
      projection: { 
        name: 1, 
        'stats.reportImage1': 1,
        'stats.reportImage2': 1,
        'stats.reportImage3': 1
      }
    });
    
    if (partner) {
      console.log(`Partner: ${partner.name}`);
      console.log(`reportImage1: ${partner.stats?.reportImage1 || 'NOT SET'}`);
      console.log(`reportImage2: ${partner.stats?.reportImage2 || 'NOT SET'}`);
      console.log(`reportImage3: ${partner.stats?.reportImage3 || 'NOT SET'}`);
    } else {
      console.log('No partner with stats found');
    }
    
  } finally {
    await client.close();
  }
}

check().catch(console.error);
