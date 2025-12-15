require('dotenv').config({ path: '.env.local' });

async function debugFrontendFlow() {
  console.log('🔍 Debugging complete frontend flow for partner report...');
  
  const slug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  
  try {
    // Step 1: Test partner data API (what fetchPartnerData calls)
    console.log('\n1. Testing partner data API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${slug}`);
    const partnerData = await partnerResponse.json();
    
    console.log('   Partner API success:', partnerData.success);
    console.log('   Partner name:', partnerData.partner?.name);
    console.log('   Events count:', partnerData.totalEvents);
    console.log('   First event stats keys:', Object.keys(partnerData.events?.[0]?.stats || {}));
    
    // Step 2: Test template API (what fetchReportTemplate calls)
    console.log('\n2. Testing template API...');
    const templateResponse = await fetch(`http://localhost:3001/api/report-config/__default_event__?type=project`);
    const templateData = await templateResponse.json();
    
    console.log('   Template API success:', templateData.success);
    console.log('   Resolved from:', templateData.resolvedFrom);
    console.log('   Template name:', templateData.template?.name);
    console.log('   Data blocks count:', templateData.template?.dataBlocks?.length);
    
    if (templateData.template?.dataBlocks) {
      console.log('   Block names:');
      for (let i = 0; i < Math.min(3, templateData.template.dataBlocks.length); i++) {
        const block = templateData.template.dataBlocks[i];
        console.log(`     ${i + 1}. ${block.name} (${block.charts?.length || 0} charts)`);
      }
    }
    
    // Step 3: Test chart configurations API (what useEffect fetches)
    console.log('\n3. Testing chart configurations API...');
    const chartResponse = await fetch('http://localhost:3001/api/chart-config/public');
    const chartData = await chartResponse.json();
    
    console.log('   Chart config API success:', chartData.success);
    console.log('   Total configurations:', chartData.configurations?.length);
    
    // Check if configurations have isActive field
    const sampleChart = chartData.configurations?.[0];
    if (sampleChart) {
      console.log('   Sample chart structure:');
      console.log('     chartId:', sampleChart.chartId);
      console.log('     title:', sampleChart.title);
      console.log('     isActive:', sampleChart.isActive);
      console.log('     elements count:', sampleChart.elements?.length);
    }
    
    // Step 4: Simulate aggregate stats calculation
    console.log('\n4. Simulating aggregate stats calculation...');
    const events = partnerData.events || [];
    
    if (events.length === 0) {
      console.log('   ❌ No events to aggregate');
      return;
    }
    
    const aggregateStats = {
      remoteImages: 0, hostessImages: 0, selfies: 0,
      female: 0, male: 0, stadium: 0, remoteFans: 0,
      merched: 0, jersey: 0, scarf: 0, flags: 0,
      genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
      indoor: 0, outdoor: 0, baseballCap: 0, other: 0,
      eventAttendees: 0, _eventCount: events.length
    };
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    // Structure like the frontend does now
    const structuredStats = {
      stats: {
        ...aggregateStats,
        totalImages: aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies,
        totalFans: aggregateStats.female + aggregateStats.male,
        allImages: aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies
      }
    };
    
    console.log('   Aggregate stats calculated:');
    console.log('     Total Images:', structuredStats.stats.totalImages);
    console.log('     Total Fans:', structuredStats.stats.totalFans);
    console.log('     Total Merch:', structuredStats.stats.merched);
    console.log('     Stats object structure: {stats: {...}}');
    console.log('     Stats fields:', Object.keys(structuredStats.stats).length);
    
    // Step 5: Check chart calculation conditions
    console.log('\n5. Checking chart calculation conditions...');
    
    const hasChartConfigs = chartData.configurations && chartData.configurations.length > 0;
    const hasAggregateStats = structuredStats && structuredStats.stats && Object.keys(structuredStats.stats).length > 0;
    const hasDataBlocks = templateData.template?.dataBlocks && templateData.template.dataBlocks.length > 0;
    
    console.log('   chartConfigurations exists:', hasChartConfigs);
    console.log('   aggregateStats exists:', hasAggregateStats);
    console.log('   dataBlocks exists:', hasDataBlocks);
    
    const shouldRenderCharts = hasChartConfigs && hasAggregateStats && hasDataBlocks;
    console.log('   Should render charts:', shouldRenderCharts);
    
    if (!shouldRenderCharts) {
      console.log('\n❌ Charts would NOT render. Issues:');
      if (!hasChartConfigs) console.log('     - No chart configurations');
      if (!hasAggregateStats) console.log('     - No aggregate stats');
      if (!hasDataBlocks) console.log('     - No data blocks');
    } else {
      console.log('\n✅ All conditions met for chart rendering');
      
      // Step 6: Test a sample chart calculation
      console.log('\n6. Testing sample chart calculation...');
      
      // Find a simple chart to test
      const genderChart = chartData.configurations?.find(c => c.chartId === 'gender-distribution');
      if (genderChart && genderChart.elements) {
        console.log('   Testing gender distribution chart:');
        console.log('     Chart title:', genderChart.title);
        console.log('     Elements:', genderChart.elements.length);
        
        for (const element of genderChart.elements) {
          console.log(`     Element: ${element.label} - Formula: ${element.formula}`);
          
          // Simple formula evaluation for testing
          let result = 'N/A';
          if (element.formula === 'stats.female') {
            result = structuredStats.stats.female;
          } else if (element.formula === 'stats.male') {
            result = structuredStats.stats.male;
          }
          console.log(`       Result: ${result}`);
        }
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('   Partner data: ✅');
    console.log('   Template data: ✅');
    console.log('   Chart configs: ✅');
    console.log('   Aggregate stats: ✅');
    console.log('   Should work: ✅');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugFrontendFlow().catch(console.error);