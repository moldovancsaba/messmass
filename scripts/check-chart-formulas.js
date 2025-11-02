const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const charts = await db.collection('chart_configurations').find({}).toArray();
    
    console.log('\n📊 Chart Formula Analysis:\n');
    
    charts.slice(0, 3).forEach(chart => {
      console.log(`Chart: ${chart.chartId}`);
      console.log(`Formula example: ${chart.elements[0]?.formula || 'N/A'}`);
      console.log('---');
    });
    
    console.log('\nBitly charts:');
    const bitlyCharts = charts.filter(c => c.chartId?.includes('bitly'));
    bitlyCharts.forEach(chart => {
      console.log(`\n${chart.chartId}:`);
      chart.elements?.forEach(el => {
        console.log(`  ${el.label}: ${el.formula}`);
      });
    });
    
  } finally {
    await client.close();
  }
}

checkCharts();
