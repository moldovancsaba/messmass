require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function debugPartnerEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Debugging partner events matching...');
    
    const slug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    
    // Get partner
    const partner = await db.collection('partners').findOne({ viewSlug: slug });
    console.log('Partner found:', !!partner);
    if (partner) {
      console.log('Partner ID:', partner._id);
      console.log('Partner ID type:', typeof partner._id);
      console.log('Partner name:', partner.name);
    }
    
    // Check different ways events might be linked
    if (partner) {
      console.log('\nTesting different event queries:');
      
      // Test 1: Direct ObjectId match
      const events1 = await db.collection('projects').find({ 
        $or: [
          { partner1: partner._id },
          { partner2: partner._id }
        ]
      }).toArray();
      console.log('1. Direct ObjectId match:', events1.length);
      
      // Test 2: String ID match
      const events2 = await db.collection('projects').find({ 
        $or: [
          { partner1: partner._id.toString() },
          { partner2: partner._id.toString() }
        ]
      }).toArray();
      console.log('2. String ID match:', events2.length);
      
      // Test 3: partner1Id/partner2Id fields
      const events3 = await db.collection('projects').find({ 
        $or: [
          { partner1Id: partner._id },
          { partner2Id: partner._id }
        ]
      }).toArray();
      console.log('3. partner1Id/partner2Id match:', events3.length);
      
      // Test 4: All combinations (like the API does)
      const events4 = await db.collection('projects').find({ 
        $or: [
          { partner1: partner._id },
          { partner2: partner._id },
          { partner1Id: partner._id },
          { partner2Id: partner._id }
        ]
      }).toArray();
      console.log('4. All combinations match:', events4.length);
      
      // Test 5: Find any events that mention SIHF in name
      const events5 = await db.collection('projects').find({ 
        eventName: { $regex: /SIHF|Swiss.*Ice.*Hockey/i }
      }).toArray();
      console.log('5. Name-based match:', events5.length);
      
      if (events5.length > 0) {
        console.log('\nEvents found by name:');
        for (const event of events5) {
          console.log(`  - ${event.eventName}`);
          console.log(`    partner1: ${event.partner1} (type: ${typeof event.partner1})`);
          console.log(`    partner2: ${event.partner2} (type: ${typeof event.partner2})`);
          console.log(`    partner1Id: ${event.partner1Id} (type: ${typeof event.partner1Id})`);
          console.log(`    partner2Id: ${event.partner2Id} (type: ${typeof event.partner2Id})`);
          
          // Check if any of these match our partner
          const matches = [
            event.partner1?.toString() === partner._id.toString(),
            event.partner2?.toString() === partner._id.toString(),
            event.partner1Id?.toString() === partner._id.toString(),
            event.partner2Id?.toString() === partner._id.toString()
          ];
          console.log(`    Matches partner: ${matches.some(m => m)}`);
        }
      }
    }
    
  } finally {
    await client.close();
  }
}

debugPartnerEvents().catch(console.error);