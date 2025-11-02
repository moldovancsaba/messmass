const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function listCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const charts = await db.collection('chart_configurations').find({}).project({ chartId: 1, title: 1, isActive: 1 }).toArray();
    
    console.log('\n📊 Charts in MongoDB Atlas:');
    console.log('═══════════════════════════════════════════════\n');
    charts.forEach(c => {
      console.log(`${c.isActive ? '✅' : '❌'} ${c.chartId} (${c.title || 'N/A'})`);
    });
    console.log(`\nTotal: ${charts.length} charts\n`);
  } finally {
    await client.close();
  }
}

listCharts();
