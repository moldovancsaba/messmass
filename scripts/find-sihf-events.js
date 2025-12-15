require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function findSihfEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Find all SIHF-related partners
    console.log('Looking for SIHF-related partners...');
    const sihfPartners = await db.collection('partners').find({ 
      name: { $regex: /SIHF|Swiss.*Ice.*Hockey/i } 
    }).toArray();
    
    console.log(`Found ${sihfPartners.length} SIHF-related partners:`);
    for (const partner of sihfPartners) {
      console.log(`  - ${partner.name} (ID: ${partner._id})`);
      console.log(`    View Slug: ${partner.viewSlug || 'None'}`);
      console.log(`    Template: ${partner.reportTemplateId || 'None'}`);
    }
    
    // Find events that might be related to SIHF
    console.log('\nLooking for SIHF-related events...');
    const sihfEvents = await db.collection('projects').find({ 
      $or: [
        { eventName: { $regex: /SIHF|Swiss.*Ice.*Hockey/i } },
        { 'partner1.name': { $regex: /SIHF|Swiss.*Ice.*Hockey/i } },
        { 'partner2.name': { $regex: /SIHF|Swiss.*Ice.*Hockey/i } }
      ]
    }).toArray();
    
    console.log(`Found ${sihfEvents.length} SIHF-related events:`);
    for (const event of sihfEvents) {
      console.log(`  - ${event.eventName}`);
      console.log(`    Partner1: ${event.partner1 || 'None'}`);
      console.log(`    Partner2: ${event.partner2 || 'None'}`);
      
      const stats = event.stats || {};
      const totalImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
      const totalFans = (stats.remoteFans || stats.indoor + stats.outdoor || 0) + (stats.stadium || 0);
      console.log(`    Stats: ${totalImages} images, ${totalFans} fans`);
    }
    
    // Check if events use partner1Id/partner2Id instead of partner1/partner2
    console.log('\nChecking for events with partner ObjectId references...');
    for (const partner of sihfPartners) {
      const eventsById = await db.collection('projects').find({ 
        $or: [
          { partner1Id: partner._id },
          { partner2Id: partner._id },
          { partner1: partner._id },
          { partner2: partner._id }
        ]
      }).toArray();
      
      if (eventsById.length > 0) {
        console.log(`\nPartner ${partner.name} has ${eventsById.length} events:`);
        for (const event of eventsById) {
          console.log(`  - ${event.eventName}`);
          const stats = event.stats || {};
          const totalImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
          const totalFans = (stats.remoteFans || stats.indoor + stats.outdoor || 0) + (stats.stadium || 0);
          console.log(`    Stats: ${totalImages} images, ${totalFans} fans`);
        }
      }
    }
    
  } finally {
    await client.close();
  }
}

findSihfEvents().catch(console.error);