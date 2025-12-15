// WHAT: Test partner report chart calculation logic
// WHY: Verify that aggregate stats work with chart formulas

const { MongoClient, ObjectId } = require('mongodb');

async function testPartnerChartCalculation() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🧪 Testing Partner Chart Calculation');
    console.log('====================================');
    
    // Get SIHF partner and events
    const sihfPartner = await db.collection('partners').findOne({ 
      name: /Swiss Ice Hockey Federation/i 
    });
    
    const partnerObjectId = new ObjectId(sihfPartner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`✅ Found ${events.length} events for SIHF`);
    
    // Calculate aggregate stats (same logic as frontend)
    const aggregate = {
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
          aggregate[key] = (aggregate[key] || 0) + value;
        }
      });
    });
    
    // Structure like event stats for chart compatibility
    const structuredStats = {
      stats: {
        ...aggregate,
        totalImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies,
        totalFans: aggregate.female + aggregate.male,
        allImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies,
        remoteFans: aggregate.remoteFans || ((aggregate.indoor || 0) + (aggregate.outdoor || 0))
      }
    };
    
    console.log('\n📊 Calculated aggregate stats:');
    console.log('   - Remote Images:', structuredStats.stats.remoteImages);
    console.log('   - Hostess Images:', structuredStats.stats.hostessImages);
    console.log('   - Selfies:', structuredStats.stats.selfies);
    console.log('   - Total Images:', structuredStats.stats.totalImages);
    console.log('   - Remote Fans:', structuredStats.stats.remoteFans);
    console.log('   - Stadium:', structuredStats.stats.stadium);
    console.log('   - Female:', structuredStats.stats.female);
    console.log('   - Male:', structuredStats.stats.male);
    console.log('   - Total Fans (female+male):', structuredStats.stats.totalFans);
    
    // Get some chart configurations to test
    const charts = await db.collection('chart_configurations').find({ 
      isActive: true 
    }).limit(5).toArray();
    
    console.log(`\n🎯 Testing with ${charts.length} chart configurations:`);
    
    charts.forEach((chart, i) => {
      console.log(`\n   Chart ${i + 1}: ${chart.name || 'Unnamed'} (${chart.type})`);
      console.log(`   - Formula: ${chart.formula || 'No formula'}`);
      console.log(`   - Element: ${chart.element || 'No element'}`);
      
      // Test if this chart would work with our aggregate stats
      if (chart.formula) {
        try {
          // Simple test - check if formula references exist in our stats
          const statsKeys = Object.keys(structuredStats.stats);
          const formulaRefs = chart.formula.match(/stats\.\w+/g) || [];
          const missingRefs = formulaRefs.filter(ref => {
            const key = ref.replace('stats.', '');
            return !statsKeys.includes(key);
          });
          
          if (missingRefs.length === 0) {
            console.log(`   ✅ All formula references available`);
          } else {
            console.log(`   ⚠️  Missing references: ${missingRefs.join(', ')}`);
          }
        } catch (err) {
          console.log(`   ❌ Formula test error: ${err.message}`);
        }
      }
    });
    
    console.log('\n✅ Chart calculation test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testPartnerChartCalculation().catch(console.error);
}

module.exports = { testPartnerChartCalculation };