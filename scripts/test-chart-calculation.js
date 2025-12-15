require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function testChartCalculation() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🧮 Testing chart calculation for SIHF...');
    
    const slug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    
    // Get partner and events (using correct field names)
    const partner = await db.collection('partners').findOne({ viewSlug: slug });
    const events = await db.collection('projects').find({ 
      $or: [
        { partner1: partner._id },
        { partner2: partner._id },
        { partner1Id: partner._id },
        { partner2Id: partner._id }
      ]
    }).toArray();
    
    console.log('Partner:', partner.name);
    console.log('Events found:', events.length);
    
    if (events.length > 0) {
      // Calculate aggregate stats exactly like the frontend
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
      
      // Sum all stats from events
      events.forEach(event => {
        Object.keys(event.stats || {}).forEach(key => {
          const value = (event.stats || {})[key];
          if (typeof value === 'number') {
            aggregateStats[key] = (aggregateStats[key] || 0) + value;
          }
        });
      });
      
      console.log('\nAggregate stats:');
      console.log('  remoteImages:', aggregateStats.remoteImages);
      console.log('  hostessImages:', aggregateStats.hostessImages);
      console.log('  selfies:', aggregateStats.selfies);
      console.log('  remoteFans:', aggregateStats.remoteFans);
      console.log('  stadium:', aggregateStats.stadium);
      console.log('  Total images:', aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies);
      console.log('  Total fans:', aggregateStats.remoteFans + aggregateStats.stadium);
      
      // Test SIHF chart calculations manually
      console.log('\nTesting SIHF chart calculations:');
      
      // unique-users: [remoteFans] + [stadium]
      const uniqueUsers = aggregateStats.remoteFans + aggregateStats.stadium;
      console.log('  unique-users (Total Fans):', uniqueUsers);
      
      // total-fans-engaged: [remoteImages] + [hostessImages] + [selfies]
      const totalFansEngaged = aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies;
      console.log('  total-fans-engaged (Total Images):', totalFansEngaged);
      
      // engagement-rate: safe division
      const totalFans = aggregateStats.remoteFans + aggregateStats.stadium;
      const totalImages = aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies;
      const engagementRate = totalFans > 0 ? (totalImages / totalFans * 100) : 0;
      console.log('  engagement-rate (Images per Fan %):', engagementRate.toFixed(2));
      
      // Check if these values would be considered valid
      console.log('\nValidation:');
      console.log('  Has valid fan data:', totalFans > 0);
      console.log('  Has valid image data:', totalImages > 0);
      console.log('  Charts would show data:', totalFans > 0 && totalImages > 0);
      
      // Test if chart configurations exist and are active
      console.log('\nChart configuration status:');
      const sihfCharts = ['unique-users', 'total-fans-engaged', 'engagement-rate'];
      
      for (const chartId of sihfCharts) {
        const chart = await db.collection('chart_configurations').findOne({ chartId });
        if (chart) {
          console.log(`  ${chartId}: ✅ exists, active: ${chart.isActive}`);
          if (chart.elements && chart.elements[0]) {
            console.log(`    Formula: ${chart.elements[0].formula}`);
          }
        } else {
          console.log(`  ${chartId}: ❌ not found`);
        }
      }
    }
    
  } finally {
    await client.close();
  }
}

testChartCalculation().catch(console.error);