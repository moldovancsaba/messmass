// WHAT: Test frontend debugging by checking what the partner report page receives
// WHY: Need to see if the issue is in data fetching or rendering

async function testFrontendDebug() {
  console.log('🌐 Testing Frontend Data Flow');
  console.log('=============================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  
  try {
    // Test the exact same API calls the frontend makes
    console.log('\n1️⃣ Testing Partner Report API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log('✅ Partner data received');
      console.log(`   - Events: ${partnerData.events.length}`);
      
      // Calculate aggregate stats like frontend does
      const events = partnerData.events;
      const aggregate = {
        remoteImages: 0,
        hostessImages: 0,
        selfies: 0,
        remoteFans: 0,
        stadium: 0,
        female: 0,
        male: 0,
        genAlpha: 0,
        genYZ: 0,
        genX: 0,
        boomer: 0,
        _eventCount: events.length
      };
      
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
      
      console.log('   - Aggregate stats calculated:');
      console.log(`     - Total Images: ${structuredStats.stats.totalImages}`);
      console.log(`     - Total Fans: ${structuredStats.stats.totalFans}`);
      console.log(`     - Female: ${structuredStats.stats.female}, Male: ${structuredStats.stats.male}`);
    }
    
    console.log('\n2️⃣ Testing Report Config API...');
    const configResponse = await fetch(`http://localhost:3001/api/report-config/__default_event__?type=project`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log('✅ Report config received');
      console.log(`   - Template: ${configData.template.name}`);
      console.log(`   - Data blocks: ${configData.template.dataBlocks?.length || 0}`);
      
      if (configData.template.dataBlocks && configData.template.dataBlocks.length > 0) {
        console.log('   - Block details:');
        configData.template.dataBlocks.slice(0, 3).forEach((block, i) => {
          console.log(`     ${i + 1}. ${block.name} (${block.charts?.length || 0} charts)`);
        });
      }
    }
    
    console.log('\n3️⃣ Testing Chart Config API...');
    const chartResponse = await fetch(`http://localhost:3001/api/chart-config/public`);
    const chartData = await chartResponse.json();
    
    if (chartData.success) {
      console.log('✅ Chart config received');
      console.log(`   - Total configurations: ${chartData.configurations.length}`);
      const activeCharts = chartData.configurations.filter(c => c.isActive);
      console.log(`   - Active configurations: ${activeCharts.length}`);
      
      // Check if charts have proper structure
      const chartsWithElements = activeCharts.filter(c => c.elements && c.elements.length > 0);
      console.log(`   - Charts with elements: ${chartsWithElements.length}`);
      
      if (chartsWithElements.length > 0) {
        console.log('   - Sample chart:');
        const sample = chartsWithElements[0];
        console.log(`     - Title: ${sample.title}`);
        console.log(`     - Type: ${sample.type}`);
        console.log(`     - Elements: ${sample.elements.length}`);
        console.log(`     - First element: ${sample.elements[0].label} = ${sample.elements[0].formula}`);
      }
    }
    
    console.log('\n✅ Frontend debug test complete');
    console.log('\n🔗 Test the actual page at:');
    console.log(`   http://localhost:3001/partner-report/${sihfSlug}`);
    
  } catch (error) {
    console.error('❌ Frontend debug failed:', error);
  }
}

// Run the test
testFrontendDebug().catch(console.error);