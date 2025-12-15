require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkSihfCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Charts from SIHF template
    const sihfCharts = [
      'report-image-1',
      'report-image-2', 
      'unique-users',
      'total-fans-engaged',
      'engagement-rate'
    ];
    
    console.log('Checking SIHF template charts...');
    
    for (const chartId of sihfCharts) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      
      if (chart) {
        console.log(`✅ ${chartId}: ${chart.title} (active: ${chart.isActive})`);
        
        // Check elements
        if (chart.elements && chart.elements.length > 0) {
          console.log(`   Elements: ${chart.elements.length}`);
          for (let i = 0; i < chart.elements.length; i++) {
            const element = chart.elements[i];
            const hasLabel = element.label && element.label !== undefined;
            const hasFormula = element.formula && element.formula !== undefined;
            console.log(`     ${i + 1}. Label: ${hasLabel ? '✅' : '❌'} Formula: ${hasFormula ? '✅' : '❌'}`);
            if (!hasLabel || !hasFormula) {
              console.log(`        Label: "${element.label}" Formula: "${element.formula}"`);
            }
          }
        } else {
          console.log(`   ❌ No elements`);
        }
      } else {
        console.log(`❌ ${chartId}: NOT FOUND`);
      }
    }
    
    // Also check if there are any issues with chart calculation
    console.log('\n--- Testing Chart Calculation ---');
    
    // Get some sample aggregate stats for SIHF
    const sihfPartner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    const sihfEvents = await db.collection('projects').find({ 
      partner1: sihfPartner._id 
    }).toArray();
    
    console.log(`SIHF has ${sihfEvents.length} events`);
    
    if (sihfEvents.length === 0) {
      console.log('⚠️  No events found - charts will show NA values');
    } else {
      // Calculate aggregate stats
      let totalImages = 0;
      let totalFans = 0;
      
      for (const event of sihfEvents) {
        const stats = event.stats || {};
        totalImages += (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
        totalFans += (stats.remoteFans || stats.indoor + stats.outdoor || 0) + (stats.stadium || 0);
      }
      
      console.log(`Aggregate stats: ${totalImages} images, ${totalFans} fans`);
      
      if (totalImages === 0 && totalFans === 0) {
        console.log('⚠️  All aggregate stats are zero - charts will show zero values');
      }
    }
    
  } finally {
    await client.close();
  }
}

checkSihfCharts().catch(console.error);