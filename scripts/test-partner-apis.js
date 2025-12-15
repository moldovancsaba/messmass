// WHAT: Test partner report APIs to verify they return correct data
// WHY: Ensure all APIs work correctly for partner report rendering

async function testPartnerAPIs() {
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  
  console.log('🧪 Testing Partner Report APIs');
  console.log('===============================');
  
  try {
    // Test 1: Partner report API
    console.log('\n1️⃣ Testing Partner Report API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log('✅ Partner API works');
      console.log(`   - Partner: ${partnerData.partner.name}`);
      console.log(`   - Events: ${partnerData.events.length}`);
      console.log(`   - Total events: ${partnerData.totalEvents}`);
      
      // Calculate aggregate stats
      let totalImages = 0;
      let totalFans = 0;
      partnerData.events.forEach(event => {
        const stats = event.stats || {};
        totalImages += (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
        totalFans += (stats.remoteFans || 0) + (stats.stadium || 0);
      });
      console.log(`   - Calculated total images: ${totalImages}`);
      console.log(`   - Calculated total fans: ${totalFans}`);
    } else {
      console.log('❌ Partner API failed:', partnerData.error);
    }
    
    // Test 2: Report config API
    console.log('\n2️⃣ Testing Report Config API...');
    const configResponse = await fetch(`http://localhost:3001/api/report-config/__default_event__?type=project`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log('✅ Report config API works');
      console.log(`   - Template: ${configData.template.name}`);
      console.log(`   - Resolved from: ${configData.resolvedFrom}`);
      console.log(`   - Data blocks: ${configData.template.dataBlocks?.length || 0}`);
      console.log(`   - Grid settings: ${JSON.stringify(configData.template.gridSettings)}`);
    } else {
      console.log('❌ Report config API failed:', configData.error);
    }
    
    // Test 3: Chart config API
    console.log('\n3️⃣ Testing Chart Config API...');
    const chartResponse = await fetch(`http://localhost:3001/api/chart-config/public`);
    const chartData = await chartResponse.json();
    
    if (chartData.success) {
      console.log('✅ Chart config API works');
      console.log(`   - Total configurations: ${chartData.configurations.length}`);
      const activeCharts = chartData.configurations.filter(c => c.isActive);
      console.log(`   - Active configurations: ${activeCharts.length}`);
      
      // Show first few active charts
      activeCharts.slice(0, 3).forEach((chart, i) => {
        console.log(`   - Chart ${i + 1}: ${chart.name} (${chart.type})`);
      });
    } else {
      console.log('❌ Chart config API failed:', chartData.error);
    }
    
    console.log('\n✅ All API tests complete');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testPartnerAPIs().catch(console.error);