require('dotenv').config({ path: '.env.local' });

async function testSafeCalculation() {
  console.log('🛡️ Testing safe chart calculation...');
  
  try {
    // Get the data like the frontend does
    const chartResponse = await fetch('http://localhost:3001/api/chart-config/public');
    const chartData = await chartResponse.json();
    const chartConfigurations = chartData.configurations;
    
    const partnerResponse = await fetch('http://localhost:3001/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954');
    const partnerData = await partnerResponse.json();
    const events = partnerData.events || [];
    
    // Calculate aggregate stats
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
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    console.log('Data loaded:');
    console.log('  Chart configurations:', chartConfigurations.length);
    console.log('  Events:', events.length);
    console.log('  Aggregate stats keys:', Object.keys(aggregateStats).length);
    console.log('  Total images:', aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies);
    console.log('  Total fans:', aggregateStats.remoteFans + aggregateStats.stadium);
    
    // Test the calculation conditions that the frontend checks
    const hasChartConfigs = chartConfigurations && chartConfigurations.length > 0;
    const hasAggregateStats = aggregateStats && Object.keys(aggregateStats).length > 0;
    
    console.log('\nCalculation conditions:');
    console.log('  chartConfigurations exists:', hasChartConfigs);
    console.log('  aggregateStats exists:', hasAggregateStats);
    console.log('  Would proceed with calculation:', hasChartConfigs && hasAggregateStats);
    
    if (hasChartConfigs && hasAggregateStats) {
      console.log('\n✅ All conditions met - calculation should work');
      
      // Check specific SIHF charts
      const sihfCharts = ['unique-users', 'total-fans-engaged', 'engagement-rate'];
      const sihfConfigs = chartConfigurations.filter(c => sihfCharts.includes(c.chartId));
      
      console.log('\nSIHF charts in configurations:');
      for (const config of sihfConfigs) {
        console.log(`  ${config.chartId}: ${config.title} (active: ${config.isActive})`);
        if (config.elements && config.elements[0]) {
          console.log(`    Formula: ${config.elements[0].formula}`);
        }
      }
      
      console.log(`\nFound ${sihfConfigs.length} SIHF charts out of ${sihfCharts.length} expected`);
    } else {
      console.log('\n❌ Conditions not met');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSafeCalculation().catch(console.error);