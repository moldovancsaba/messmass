require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkSihfChartFormulas() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Checking SIHF chart formulas...');
    
    const sihfCharts = ['report-image-1', 'report-image-2', 'unique-users', 'total-fans-engaged', 'engagement-rate'];
    
    // Sample aggregate stats from SIHF events
    const aggregateStats = {
      remoteImages: 9,
      hostessImages: 0,
      selfies: 382,
      remoteFans: 16,
      stadium: 926,
      indoor: 0,
      outdoor: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      eventAttendees: 0,
      eventTicketPurchases: 0,
      visitQrCode: 0,
      visitShortUrl: 0,
      visitWeb: 0,
      visitFacebook: 0,
      visitInstagram: 0,
      visitYoutube: 0,
      visitTiktok: 0,
      visitX: 0,
      visitTrustpilot: 0,
      _eventCount: 3
    };
    
    for (const chartId of sihfCharts) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      
      if (chart) {
        console.log(`\n📊 ${chartId}: ${chart.title}`);
        console.log(`   Type: ${chart.type}`);
        console.log(`   Elements: ${chart.elements?.length || 0}`);
        
        if (chart.elements) {
          for (let i = 0; i < chart.elements.length; i++) {
            const element = chart.elements[i];
            console.log(`     ${i + 1}. ${element.label}`);
            console.log(`        Formula: ${element.formula}`);
            
            // Check if formula references fields that exist in aggregateStats
            const formula = element.formula || '';
            const fieldMatches = formula.match(/\[([^\]]+)\]/g);
            
            if (fieldMatches) {
              console.log(`        References:`);
              for (const match of fieldMatches) {
                const fieldName = match.slice(1, -1).toLowerCase(); // Remove brackets and lowercase
                const hasField = aggregateStats.hasOwnProperty(fieldName);
                const value = aggregateStats[fieldName];
                console.log(`          ${match} -> ${fieldName}: ${hasField ? value : 'MISSING'}`);
              }
            }
          }
        }
      }
    }
    
    // Also check if there are any problematic charts in the full list
    console.log('\n🔍 Checking for potentially problematic chart formulas...');
    
    const allCharts = await db.collection('chart_configurations').find({ isActive: true }).toArray();
    let problematicCharts = 0;
    
    for (const chart of allCharts) {
      if (chart.elements) {
        for (const element of chart.elements) {
          const formula = element.formula || '';
          
          // Check for division operations that might cause issues
          if (formula.includes('/') || formula.includes('÷')) {
            console.log(`⚠️  Division in ${chart.chartId}: ${element.formula}`);
            problematicCharts++;
          }
          
          // Check for complex formulas that might fail
          if (formula.includes('Math.') || formula.includes('(') && formula.includes(')')) {
            // This might be a complex formula
            if (formula.length > 50) {
              console.log(`⚠️  Complex formula in ${chart.chartId}: ${element.formula.substring(0, 50)}...`);
              problematicCharts++;
            }
          }
        }
      }
    }
    
    console.log(`\nFound ${problematicCharts} potentially problematic charts out of ${allCharts.length} total`);
    
  } finally {
    await client.close();
  }
}

checkSihfChartFormulas().catch(console.error);