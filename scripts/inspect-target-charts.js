const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const col = db.collection('chartConfigurations');
    
    console.log('\n🔍 Inspecting Target Charts for P0 Fixes:\n');
    console.log('═══════════════════════════════════════════════\n');
    
    // Look for engagement-related charts
    const engagementCharts = await col.find({ $or: [
      { chartId: 'engagement' },
      { chartId: { $regex: /engage/i } },
      { title: { $regex: /engage/i } }
    ]}).toArray();
    
    console.log('📊 Engagement-related charts:');
    engagementCharts.forEach(c => console.log(`  - ${c.chartId}: ${c.title}`));
    
    // Look for value prop charts
    const vpCharts = await col.find({ $or: [
      { chartId: 'value-prop-conversion-rate' },
      { chartId: { $regex: /value.*prop/i } },
      { chartId: { $regex: /conversion/i } },
      { title: { $regex: /value.*prop/i } }
    ]}).toArray();
    
    console.log('\n💰 Value Prop charts:');
    vpCharts.forEach(c => console.log(`  - ${c.chartId}: ${c.title}`));
    
    // Faces chart
    const faces = await col.findOne({ chartId: 'faces' });
    console.log('\n😀 Faces chart:');
    if (faces) {
      console.log(`  - chartId: ${faces.chartId}`);
      console.log(`  - title: ${faces.title}`);
      console.log(`  - isActive: ${faces.isActive}`);
      console.log(`  - type: ${faces.type}`);
    }
    
    // Get all chart IDs for reference
    console.log('\n📋 All chartIds in database:');
    const allCharts = await col.find({}).project({ chartId: 1 }).toArray();
    allCharts.forEach(c => console.log(`  - ${c.chartId}`));
    
  } finally {
    await client.close();
  }
}

inspect();
