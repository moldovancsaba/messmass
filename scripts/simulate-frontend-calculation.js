require('dotenv').config({ path: '.env.local' });

async function simulateFrontendCalculation() {
  console.log('🎭 Simulating frontend chart calculation...');
  
  try {
    // 1. Simulate fetching chart configurations (like useEffect does)
    console.log('\n1. Fetching chart configurations...');
    const chartResponse = await fetch('http://localhost:3001/api/chart-config/public');
    const chartData = await chartResponse.json();
    
    if (!chartData.success) {
      console.log('❌ Chart config API failed');
      return;
    }
    
    const chartConfigurations = chartData.configurations;
    console.log(`✅ Loaded ${chartConfigurations.length} chart configurations`);
    
    // 2. Simulate fetching partner data
    console.log('\n2. Fetching partner data...');
    const partnerResponse = await fetch('http://localhost:3001/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954');
    const partnerData = await partnerResponse.json();
    
    if (!partnerData.success) {
      console.log('❌ Partner API failed');
      return;
    }
    
    console.log(`✅ Loaded partner with ${partnerData.totalEvents} events`);
    
    // 3. Simulate aggregate stats calculation (like useMemo does)
    console.log('\n3. Calculating aggregate stats...');
    const events = partnerData.events || [];
    
    if (events.length === 0) {
      console.log('❌ No events found');
      return;
    }
    
    const aggregateStats = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      remoteFans: 0,
      stadium: 0,
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
      _eventCount: events.length
    };
    
    // Sum all stats across events
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    console.log('✅ Aggregate stats calculated');
    console.log('   Total images:', aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies);
    console.log('   Total fans:', aggregateStats.remoteFans + aggregateStats.stadium);
    
    // 4. Simulate chart calculation conditions (like useMemo does)
    console.log('\n4. Checking chart calculation conditions...');
    
    const hasChartConfigs = chartConfigurations && chartConfigurations.length > 0;
    const hasAggregateStats = aggregateStats && Object.keys(aggregateStats).length > 0;
    
    console.log('   chartConfigurations exists:', hasChartConfigs);
    console.log('   chartConfigurations length:', chartConfigurations?.length || 0);
    console.log('   aggregateStats exists:', hasAggregateStats);
    console.log('   aggregateStats keys:', Object.keys(aggregateStats).length);
    
    if (!hasChartConfigs) {
      console.log('❌ Chart calculation would fail: no chart configurations');
      return;
    }
    
    if (!hasAggregateStats) {
      console.log('❌ Chart calculation would fail: no aggregate stats');
      return;
    }
    
    console.log('✅ Chart calculation conditions met');
    
    // 5. Simulate template fetching
    console.log('\n5. Fetching template...');
    const templateResponse = await fetch('http://localhost:3001/api/report-config/903f80ab-e105-4aaa-8c42-2caf71a46954?type=partner');
    const templateData = await templateResponse.json();
    
    if (!templateData.success) {
      console.log('❌ Template API failed');
      return;
    }
    
    const dataBlocks = templateData.template?.dataBlocks || [];
    console.log(`✅ Template loaded with ${dataBlocks.length} blocks`);
    
    // 6. Check final rendering conditions
    console.log('\n6. Checking final rendering conditions...');
    
    const hasDataBlocks = dataBlocks.length > 0;
    // We can't actually run calculateActiveCharts here, but we can check the conditions
    const wouldHaveChartResults = hasChartConfigs && hasAggregateStats;
    
    console.log('   dataBlocks.length > 0:', hasDataBlocks);
    console.log('   would have chartResults:', wouldHaveChartResults);
    console.log('   UnifiedDataVisualization would render:', hasDataBlocks && wouldHaveChartResults);
    
    if (hasDataBlocks && wouldHaveChartResults) {
      console.log('\n✅ SUCCESS: All conditions met for chart rendering');
      console.log('   Template blocks:');
      for (let i = 0; i < dataBlocks.length; i++) {
        const block = dataBlocks[i];
        console.log(`     ${i + 1}. ${block.name} (${block.charts?.length || 0} charts)`);
      }
    } else {
      console.log('\n❌ FAILURE: Charts would not render');
      if (!hasDataBlocks) console.log('   Reason: No data blocks');
      if (!wouldHaveChartResults) console.log('   Reason: Chart calculation would fail');
    }
    
  } catch (error) {
    console.error('❌ Simulation error:', error.message);
  }
}

simulateFrontendCalculation().catch(console.error);