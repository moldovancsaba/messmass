// WHAT: Test partner report system end-to-end
// WHY: Verify that partner reports work like event reports with aggregated data

const { MongoClient, ObjectId } = require('mongodb');

async function testPartnerReportSystem() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🧪 Testing Partner Report System');
    console.log('=====================================');
    
    // Find SIHF partner
    const sihfPartner = await db.collection('partners').findOne({ 
      name: /Swiss Ice Hockey Federation/i 
    });
    
    if (!sihfPartner) {
      console.log('❌ SIHF partner not found');
      return;
    }
    
    console.log('✅ Found SIHF partner:', sihfPartner.name);
    console.log('   - ID:', sihfPartner._id.toString());
    console.log('   - ViewSlug:', sihfPartner.viewSlug);
    
    // Find events for this partner
    const partnerObjectId = new ObjectId(sihfPartner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${events.length} events for SIHF:`);
    
    let totalImages = 0;
    let totalFans = 0;
    let totalSelfies = 0;
    
    events.forEach((event, i) => {
      const stats = event.stats || {};
      const eventImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
      const eventFans = (stats.remoteFans || 0) + (stats.stadium || 0);
      const eventSelfies = stats.selfies || 0;
      
      console.log(`   ${i + 1}. ${event.eventName}`);
      console.log(`      - Images: ${eventImages} (remote: ${stats.remoteImages || 0}, hostess: ${stats.hostessImages || 0}, selfies: ${stats.selfies || 0})`);
      console.log(`      - Fans: ${eventFans} (remote: ${stats.remoteFans || 0}, stadium: ${stats.stadium || 0})`);
      
      totalImages += eventImages;
      totalFans += eventFans;
      totalSelfies += eventSelfies;
    });
    
    console.log(`\n🎯 AGGREGATE TOTALS:`);
    console.log(`   - Total Images: ${totalImages}`);
    console.log(`   - Total Fans: ${totalFans}`);
    console.log(`   - Total Selfies: ${totalSelfies}`);
    
    // Test API endpoint
    console.log(`\n🌐 Testing API endpoint...`);
    const apiUrl = `http://localhost:3001/api/partners/report/${sihfPartner.viewSlug}`;
    console.log(`   URL: ${apiUrl}`);
    
    // Test report config API
    console.log(`\n📋 Testing report config API...`);
    const configUrl = `http://localhost:3001/api/report-config/__default_event__?type=project`;
    console.log(`   URL: ${configUrl}`);
    
    // Test chart config API
    console.log(`\n📊 Testing chart config API...`);
    const chartUrl = `http://localhost:3001/api/chart-config/public`;
    console.log(`   URL: ${chartUrl}`);
    
    console.log(`\n✅ Partner report system test complete`);
    console.log(`\n🔗 Test URL: http://localhost:3001/partner-report/${sihfPartner.viewSlug}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testPartnerReportSystem().catch(console.error);
}

module.exports = { testPartnerReportSystem };