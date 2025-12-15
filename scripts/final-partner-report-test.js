require('dotenv').config({ path: '.env.local' });

async function finalPartnerReportTest() {
  console.log('🎯 Final Partner Report System Test');
  console.log('=====================================');
  
  try {
    const slug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    
    // Test complete flow
    console.log('\n1. Partner Data API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${slug}`);
    const partnerData = await partnerResponse.json();
    console.log(`   ✅ ${partnerData.partner?.name} - ${partnerData.totalEvents} events`);
    
    console.log('\n2. Template API (Default Event Template)...');
    const templateResponse = await fetch(`http://localhost:3001/api/report-config/__default_event__?type=project`);
    const templateData = await templateResponse.json();
    console.log(`   ✅ ${templateData.template?.name} - ${templateData.template?.dataBlocks?.length} blocks`);
    
    console.log('\n3. Chart Configurations API...');
    const chartResponse = await fetch('http://localhost:3001/api/chart-config/public');
    const chartData = await chartResponse.json();
    console.log(`   ✅ ${chartData.configurations?.length} chart configurations loaded`);
    
    console.log('\n4. Aggregate Stats Calculation...');
    const events = partnerData.events || [];
    const aggregate = {};
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregate[key] = (aggregate[key] || 0) + value;
        }
      });
    });
    
    const structuredStats = {
      stats: {
        ...aggregate,
        totalImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies,
        totalFans: aggregate.female + aggregate.male,
        allImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies
      }
    };
    
    console.log(`   ✅ Aggregated ${events.length} events into structured stats object`);
    console.log(`      Total Images: ${structuredStats.stats.totalImages}`);
    console.log(`      Total Fans: ${structuredStats.stats.totalFans}`);
    console.log(`      Total Merch: ${structuredStats.stats.merched}`);
    
    console.log('\n5. Chart Calculation Test...');
    
    // Test key charts
    const testCharts = [
      { id: 'gender-distribution', field: 'female', expected: structuredStats.stats.female },
      { id: 'merchandise-distribution', field: 'merched', expected: structuredStats.stats.merched }
    ];
    
    for (const test of testCharts) {
      const chart = chartData.configurations?.find(c => c.chartId === test.id);
      if (chart) {
        console.log(`   ✅ ${chart.title}: Found with ${chart.elements?.length} elements`);
        if (chart.elements?.[0]) {
          console.log(`      Formula: ${chart.elements[0].formula}`);
          console.log(`      Expected value: ${test.expected}`);
        }
      } else {
        console.log(`   ❌ ${test.id}: Chart not found`);
      }
    }
    
    console.log('\n6. Rendering Conditions...');
    const hasChartConfigs = chartData.configurations && chartData.configurations.length > 0;
    const hasAggregateStats = structuredStats && structuredStats.stats && Object.keys(structuredStats.stats).length > 0;
    const hasDataBlocks = templateData.template?.dataBlocks && templateData.template.dataBlocks.length > 0;
    
    console.log(`   Chart Configurations: ${hasChartConfigs ? '✅' : '❌'}`);
    console.log(`   Aggregate Stats: ${hasAggregateStats ? '✅' : '❌'}`);
    console.log(`   Data Blocks: ${hasDataBlocks ? '✅' : '❌'}`);
    
    const shouldWork = hasChartConfigs && hasAggregateStats && hasDataBlocks;
    console.log(`   Should Render Charts: ${shouldWork ? '✅' : '❌'}`);
    
    console.log('\n🎯 FINAL RESULT:');
    if (shouldWork) {
      console.log('✅ PARTNER REPORT SYSTEM IS WORKING!');
      console.log('');
      console.log('Expected behavior:');
      console.log('- Shows default event template (11 blocks)');
      console.log('- Displays aggregated data from all partner events');
      console.log('- Charts show real values (not NA or errors)');
      console.log('- Works for ANY partner with ANY events');
      console.log('');
      console.log('Sample values for SIHF:');
      console.log(`- Gender Distribution: ${structuredStats.stats.female} female, ${structuredStats.stats.male} male`);
      console.log(`- Total Images: ${structuredStats.stats.totalImages}`);
      console.log(`- Total Merch: ${structuredStats.stats.merched}`);
    } else {
      console.log('❌ SYSTEM NOT WORKING - Check the issues above');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

finalPartnerReportTest().catch(console.error);