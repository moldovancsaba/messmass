const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkImageCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const charts = await db.collection('chartConfigurations').find({ type: 'image' }).toArray();
    
    console.log(`\n📊 Found ${charts.length} IMAGE charts:\n`);
    charts.forEach((chart, i) => {
      console.log(`${i+1}. ${chart.chartId} (${chart.title})`);
      console.log(`   aspectRatio: ${chart.aspectRatio || 'UNDEFINED'}\n`);
    });
  } finally {
    await client.close();
  }
}

checkImageCharts();
