// Script to check Value chart configurations in MongoDB
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartconfigurations';

async function checkValueCharts() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find all charts with 'value' in the chartId
    console.log('\n=== Searching for all charts with "value" in chartId ===');
    const valueCharts = await collection.find({ 
      chartId: { $regex: 'value', $options: 'i' } 
    }).toArray();
    
    console.log(`Found ${valueCharts.length} chart(s) with "value" in chartId:\n`);
    
    valueCharts.forEach(chart => {
      console.log(`Chart ID: ${chart.chartId}`);
      console.log(`Title: ${chart.title}`);
      console.log(`Order: ${chart.order}`);
      console.log(`Active: ${chart.isActive}`);
      console.log(`Total Label: ${chart.totalLabel}`);
      console.log(`Subtitle: ${chart.subtitle || 'None'}`);
      console.log(`Elements:`);
      chart.elements.forEach(el => {
        console.log(`  - ${el.id}: ${el.label} | Formula: ${el.formula}`);
      });
      console.log(`Created: ${chart.createdAt}`);
      console.log(`Updated: ${chart.updatedAt}`);
      console.log('---\n');
    });
    
    // Check if there's a chart at order 6
    console.log('=== Checking chart at order 6 ===');
    const orderSixChart = await collection.findOne({ order: 6 });
    if (orderSixChart) {
      console.log(`Chart at order 6:`);
      console.log(`- ID: ${orderSixChart.chartId}`);
      console.log(`- Title: ${orderSixChart.title}`);
      console.log(`- Total Label: ${orderSixChart.totalLabel}`);
    } else {
      console.log('No chart found at order 6');
    }
    
    // Get all charts sorted by order
    console.log('\n=== All charts by order ===');
    const allCharts = await collection.find({}).sort({ order: 1 }).toArray();
    allCharts.forEach(chart => {
      console.log(`Order ${chart.order}: ${chart.chartId} - "${chart.title}" (Active: ${chart.isActive})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

checkValueCharts();
