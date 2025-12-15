require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugPartnerReport() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Debugging SIHF partner report data flow...');
    
    // 1. Check template API response
    console.log('\n1. Template API Response:');
    try {
      const response = await fetch('http://localhost:3001/api/report-config/903f80ab-e105-4aaa-8c42-2caf71a46954?type=partner');
      const templateData = await response.json();
      
      console.log('   Success:', templateData.success);
      console.log('   Resolved from:', templateData.resolvedFrom);
      console.log('   Template name:', templateData.template?.name);
      console.log('   Data blocks:', templateData.template?.dataBlocks?.length || 0);
      
      if (templateData.template?.dataBlocks) {
        for (let i = 0; i < templateData.template.dataBlocks.length; i++) {
          const block = templateData.template.dataBlocks[i];
          console.log(`     Block ${i + 1}: ${block.name} (${block.charts?.length || 0} charts)`);
          if (block.charts) {
            for (const chart of block.charts) {
              console.log(`       - ${chart.chartId}`);
            }
          }
        }
      }
    } catch (err) {
      console.log('   ❌ Template API error:', err.message);
    }
    
    // 2. Check partner API response
    console.log('\n2. Partner API Response:');
    try {
      const response = await fetch('http://localhost:3001/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954');
      const partnerData = await response.json();
      
      console.log('   Success:', partnerData.success);
      console.log('   Partner name:', partnerData.partner?.name);
      console.log('   Events:', partnerData.totalEvents);
      
      // Calculate aggregate stats like the frontend does
      if (partnerData.events && partnerData.events.length > 0) {
        let totalImages = 0;
        let totalFans = 0;
        let totalAttendees = 0;
        
        for (const event of partnerData.events) {
          const stats = event.stats || {};
          totalImages += (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
          totalFans += (stats.remoteFans || 0) + (stats.stadium || 0);
          totalAttendees += stats.eventAttendees || 0;
        }
        
        console.log('   Aggregate stats:');
        console.log('     Total Images:', totalImages);
        console.log('     Total Fans:', totalFans);
        console.log('     Total Attendees:', totalAttendees);
        
        // This is the aggregate stats object that would be passed to chart calculation
        const aggregateStats = {
          remoteImages: 0,
          hostessImages: 0,
          selfies: 0,
          remoteFans: 0,
          stadium: 0,
          indoor: 0,
          outdoor: 0,
          // ... other fields would be summed from events
        };
        
        // Sum all stats from events
        for (const event of partnerData.events) {
          const stats = event.stats || {};
          Object.keys(stats).forEach(key => {
            if (typeof stats[key] === 'number') {
              aggregateStats[key] = (aggregateStats[key] || 0) + stats[key];
            }
          });
        }
        
        console.log('   Sample aggregate fields:');
        console.log('     remoteImages:', aggregateStats.remoteImages);
        console.log('     selfies:', aggregateStats.selfies);
        console.log('     stadium:', aggregateStats.stadium);
        console.log('     remoteFans:', aggregateStats.remoteFans);
      }
    } catch (err) {
      console.log('   ❌ Partner API error:', err.message);
    }
    
    // 3. Check chart configurations for SIHF template charts
    console.log('\n3. Chart Configurations:');
    const sihfCharts = ['report-image-1', 'report-image-2', 'unique-users', 'total-fans-engaged', 'engagement-rate'];
    
    for (const chartId of sihfCharts) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      if (chart) {
        console.log(`   ✅ ${chartId}: ${chart.title} (active: ${chart.isActive})`);
      } else {
        console.log(`   ❌ ${chartId}: NOT FOUND`);
      }
    }
    
    // 4. Check if there are any issues with chart calculation
    console.log('\n4. Chart Calculation Test:');
    
    // Get all active chart configurations
    const activeCharts = await db.collection('chart_configurations').find({ isActive: true }).toArray();
    console.log(`   Found ${activeCharts.length} active chart configurations`);
    
    // Check if the SIHF charts are in the active list
    const sihfActiveCharts = activeCharts.filter(chart => sihfCharts.includes(chart.chartId));
    console.log(`   SIHF charts that are active: ${sihfActiveCharts.length}/${sihfCharts.length}`);
    
    for (const chart of sihfActiveCharts) {
      console.log(`     - ${chart.chartId}: ${chart.title}`);
    }
    
  } finally {
    await client.close();
  }
}

debugPartnerReport().catch(console.error);