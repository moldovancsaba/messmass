require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testFullPartnerReport() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🧪 Testing full partner report flow for SIHF...');
    
    const slug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    
    // 1. Test partner API
    console.log('\n1. Testing Partner API...');
    try {
      const response = await fetch(`http://localhost:3001/api/partners/report/${slug}`);
      const data = await response.json();
      
      console.log('   ✅ Partner API success:', data.success);
      console.log('   Partner:', data.partner?.name);
      console.log('   Style ID:', data.partner?.styleId || 'None');
      console.log('   Template ID:', data.partner?.reportTemplateId || 'None');
      console.log('   Events:', data.totalEvents);
    } catch (err) {
      console.log('   ❌ Partner API error:', err.message);
    }
    
    // 2. Test template API
    console.log('\n2. Testing Template API...');
    try {
      const response = await fetch(`http://localhost:3001/api/report-config/${slug}?type=partner`);
      const data = await response.json();
      
      console.log('   ✅ Template API success:', data.success);
      console.log('   Resolved from:', data.resolvedFrom);
      console.log('   Template name:', data.template?.name);
      console.log('   Data blocks:', data.template?.dataBlocks?.length || 0);
      
      if (data.template?.dataBlocks) {
        for (let i = 0; i < data.template.dataBlocks.length; i++) {
          const block = data.template.dataBlocks[i];
          console.log(`     Block ${i + 1}: ${block.name} (${block.charts?.length || 0} charts)`);
        }
      }
    } catch (err) {
      console.log('   ❌ Template API error:', err.message);
    }
    
    // 3. Test chart configurations API
    console.log('\n3. Testing Chart Configurations API...');
    try {
      const response = await fetch('http://localhost:3001/api/chart-config/public');
      const data = await response.json();
      
      console.log('   ✅ Chart config API success:', data.success);
      console.log('   Total charts:', data.configurations?.length || 0);
      
      // Check SIHF specific charts
      const sihfCharts = ['report-image-1', 'report-image-2', 'unique-users', 'total-fans-engaged', 'engagement-rate'];
      const foundCharts = data.configurations?.filter(c => sihfCharts.includes(c.chartId)) || [];
      console.log('   SIHF charts found:', foundCharts.length);
      
      for (const chart of foundCharts) {
        console.log(`     - ${chart.chartId}: ${chart.title} (active: ${chart.isActive})`);
      }
    } catch (err) {
      console.log('   ❌ Chart config API error:', err.message);
    }
    
    // 4. Test chart calculation manually
    console.log('\n4. Testing Chart Calculation...');
    
    // Get SIHF events and calculate aggregate stats
    const sihfPartner = await db.collection('partners').findOne({ viewSlug: slug });
    const events = await db.collection('projects').find({ 
      $or: [
        { partner1: sihfPartner._id },
        { partner2: sihfPartner._id }
      ]
    }).toArray();
    
    console.log('   Events found:', events.length);
    
    if (events.length > 0) {
      // Calculate aggregate stats like the frontend does
      const aggregateStats = {
        remoteImages: 0,
        hostessImages: 0,
        selfies: 0,
        remoteFans: 0,
        stadium: 0,
        indoor: 0,
        outdoor: 0,
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
      
      console.log('   Aggregate stats calculated:');
      console.log('     remoteImages:', aggregateStats.remoteImages);
      console.log('     selfies:', aggregateStats.selfies);
      console.log('     remoteFans:', aggregateStats.remoteFans);
      console.log('     stadium:', aggregateStats.stadium);
      
      // Test SIHF chart formulas manually
      console.log('\n   Testing SIHF chart formulas:');
      
      const sihfChartTests = [
        { id: 'unique-users', formula: '[remoteFans] + [stadium]' },
        { id: 'total-fans-engaged', formula: '[remoteImages] + [hostessImages] + [selfies]' },
        { id: 'engagement-rate', formula: '([remoteFans] + [stadium]) > 0 ? (([remoteImages] + [hostessImages] + [selfies]) / ([remoteFans] + [stadium]) * 100) : 0' }
      ];
      
      for (const test of sihfChartTests) {
        try {
          // Simple formula evaluation
          let result = test.formula;
          result = result.replace(/\[remoteFans\]/g, aggregateStats.remoteFans || 0);
          result = result.replace(/\[stadium\]/g, aggregateStats.stadium || 0);
          result = result.replace(/\[remoteImages\]/g, aggregateStats.remoteImages || 0);
          result = result.replace(/\[hostessImages\]/g, aggregateStats.hostessImages || 0);
          result = result.replace(/\[selfies\]/g, aggregateStats.selfies || 0);
          
          // For simple formulas, evaluate
          if (!result.includes('?')) {
            const value = eval(result);
            console.log(`     ${test.id}: ${value}`);
          } else {
            console.log(`     ${test.id}: ${result} (complex formula)`);
          }
        } catch (err) {
          console.log(`     ${test.id}: ERROR - ${err.message}`);
        }
      }
    }
    
    // 5. Check if there are any blocking errors
    console.log('\n5. Checking for potential blocking issues...');
    
    // Check if all required collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['partners', 'projects', 'chart_configurations', 'report_templates', 'data_blocks'];
    for (const collection of requiredCollections) {
      const exists = collectionNames.includes(collection);
      console.log(`   ${exists ? '✅' : '❌'} Collection ${collection}: ${exists ? 'exists' : 'MISSING'}`);
    }
    
    console.log('\n🎯 Test complete. Check the results above to identify the issue.');
    
  } finally {
    await client.close();
  }
}

testFullPartnerReport().catch(console.error);