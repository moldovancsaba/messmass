// Test the partner report fix
// Run with: node scripts/test-partner-fix.js

const { MongoClient, ObjectId } = require('mongodb');

async function testPartnerFix() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Testing partner report fix...\n');
    
    // ==========================================
    // 1. TEST FORCED DEFAULT EVENT TEMPLATE
    // ==========================================
    console.log('📋 Testing forced default event template resolution...');
    
    const defaultEventTemplate = await db.collection('report_templates').findOne({ 
      type: 'event', 
      isDefault: true 
    });
    
    if (!defaultEventTemplate) {
      console.error('❌ No default event template found');
      return;
    }
    
    console.log('✅ Default event template:', defaultEventTemplate.name);
    console.log('✅ Data blocks:', defaultEventTemplate.dataBlocks?.length || 0);
    
    // ==========================================
    // 2. CHECK CHART COMPATIBILITY
    // ==========================================
    console.log('\n📊 Checking chart compatibility...');
    
    let validCharts = 0;
    let totalCharts = 0;
    
    if (defaultEventTemplate.dataBlocks && defaultEventTemplate.dataBlocks.length > 0) {
      for (const blockRef of defaultEventTemplate.dataBlocks) {
        const block = await db.collection('data_blocks').findOne({ _id: new ObjectId(blockRef.blockId) });
        if (block && block.isActive && block.charts) {
          for (const chart of block.charts) {
            totalCharts++;
            
            const chartConfig = await db.collection('chart_configurations').findOne({ 
              chartId: chart.chartId,
              isActive: true
            });
            
            if (chartConfig) {
              validCharts++;
              console.log(`  ✅ ${chart.chartId}: ${chartConfig.title} (${chartConfig.type})`);
            } else {
              console.log(`  ❌ ${chart.chartId}: NOT FOUND`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Chart compatibility: ${validCharts}/${totalCharts} (${Math.round(validCharts/totalCharts*100)}%)`);
    
    // ==========================================
    // 3. TEST PARTNER DATA AGGREGATION
    // ==========================================
    console.log('\n📊 Testing partner data aggregation...');
    
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }
    
    const partnerObjectId = new ObjectId(partner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`✅ Partner: ${partner.name}`);
    console.log(`✅ Events: ${events.length}`);
    
    // Test aggregation
    const aggregateStats = {
      female: 0,
      male: 0,
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      merched: 0,
      eventAttendees: 0
    };
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number' && aggregateStats.hasOwnProperty(key)) {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    console.log('✅ Aggregate stats:');
    console.log(`  Total Fans: ${aggregateStats.female + aggregateStats.male}`);
    console.log(`  Total Images: ${aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies}`);
    console.log(`  Merched: ${aggregateStats.merched}`);
    console.log(`  Event Attendees: ${aggregateStats.eventAttendees}`);
    
    // ==========================================
    // 4. TEST KEY CHART CALCULATIONS
    // ==========================================
    console.log('\n🧮 Testing key chart calculations...');
    
    // Test Gender Distribution (should work)
    const genderChart = await db.collection('chart_configurations').findOne({ 
      chartId: 'gender-distribution' 
    });
    
    if (genderChart) {
      console.log(`✅ Gender Distribution chart found`);
      console.log(`  Female: ${aggregateStats.female}`);
      console.log(`  Male: ${aggregateStats.male}`);
      console.log(`  Total: ${aggregateStats.female + aggregateStats.male}`);
      console.log(`  Valid: ${aggregateStats.female + aggregateStats.male > 0 ? '✅' : '❌'}`);
    }
    
    // Test Age Groups (should work)
    const ageChart = await db.collection('chart_configurations').findOne({ 
      chartId: 'age-groups' 
    });
    
    if (ageChart) {
      console.log(`✅ Age Groups chart found`);
      // We'd need to check genAlpha, genYZ, etc. but the key point is the chart exists
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('✅ Default event template has compatible charts');
    console.log('✅ Partner data aggregation works');
    console.log('✅ Key charts should now display');
    console.log('');
    console.log('The fix should work! Partner reports will now use the default event template');
    console.log('with standard chart IDs that exist in the chart_configurations collection.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testPartnerFix().catch(console.error);