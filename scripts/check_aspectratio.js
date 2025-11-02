const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAspectRatio() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'messmass';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('chart_configurations');
    
    // Find all image charts
    const imageCharts = await collection.find({ type: 'image' }).toArray();
    
    console.log(`Found ${imageCharts.length} image charts:\n`);
    
    imageCharts.forEach(chart => {
      console.log(`Chart: ${chart.title || chart.chartId}`);
      console.log(`  _id: ${chart._id}`);
      console.log(`  chartId: ${chart.chartId}`);
      console.log(`  aspectRatio: ${chart.aspectRatio || 'NOT SET'}`);
      console.log(`  updatedAt: ${chart.updatedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAspectRatio();
