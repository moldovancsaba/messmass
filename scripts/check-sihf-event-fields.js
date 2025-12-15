require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkSihfEventFields() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Checking SIHF event fields...');
    
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    const events = await db.collection('projects').find({ 
      $or: [
        { partner1: partner._id },
        { partner2: partner._id },
        { partner1Id: partner._id },
        { partner2Id: partner._id }
      ]
    }).toArray();
    
    console.log(`Found ${events.length} SIHF events`);
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\nEvent ${i + 1}: ${event.eventName}`);
      console.log('Stats fields:', Object.keys(event.stats || {}));
      console.log('Stats values:');
      
      const stats = event.stats || {};
      Object.entries(stats).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    // Calculate what the aggregate should look like
    console.log('\n📊 Calculating proper aggregate stats...');
    
    const aggregateStats = {};
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    console.log('\nAggregate stats:');
    Object.entries(aggregateStats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Calculate derived fields that charts expect
    console.log('\nDerived fields for charts:');
    const totalImages = (aggregateStats.remoteImages || 0) + (aggregateStats.hostessImages || 0) + (aggregateStats.selfies || 0);
    const totalFans = (aggregateStats.female || 0) + (aggregateStats.male || 0);
    const totalFansAlt = (aggregateStats.remoteFans || 0) + (aggregateStats.stadium || 0);
    
    console.log(`  Total Images: ${totalImages}`);
    console.log(`  Total Fans (female + male): ${totalFans}`);
    console.log(`  Total Fans (remoteFans + stadium): ${totalFansAlt}`);
    
    if (totalFans === 0 && totalFansAlt > 0) {
      console.log('\n⚠️  Issue: Events use remoteFans/stadium but charts expect female/male');
      console.log('   Need to map remoteFans/stadium to female/male for chart compatibility');
    }
    
  } finally {
    await client.close();
  }
}

checkSihfEventFields().catch(console.error);