// Check what hashtags SIHF events actually have
// Run with: node scripts/check-sihf-hashtags.js

const { MongoClient, ObjectId } = require('mongodb');

async function checkSIHFHashtags() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Checking SIHF event hashtags...\n');
    
    // Get partner
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }
    
    console.log('Partner:', partner.name);
    console.log('Partner hashtags:', partner.hashtags);
    console.log('Partner categorizedHashtags:', partner.categorizedHashtags);
    
    // Get partner events
    const partnerObjectId = new ObjectId(partner._id);
    const partnerEvents = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`\nFound ${partnerEvents.length} events for partner:\n`);
    
    partnerEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.eventName}`);
      console.log('  Date:', event.eventDate);
      console.log('  Hashtags:', event.hashtags || []);
      console.log('  CategorizedHashtags:', event.categorizedHashtags || {});
      console.log('  Stats keys:', Object.keys(event.stats || {}));
      console.log('  Female:', event.stats?.female || 0);
      console.log('  Male:', event.stats?.male || 0);
      console.log('');
    });
    
    // Now let's test with a working hashtag
    console.log('🔍 Testing with a working hashtag...\n');
    
    // Find a hashtag that actually exists
    const sampleProject = await db.collection('projects').findOne({
      hashtags: { $exists: true, $ne: [] }
    });
    
    if (sampleProject && sampleProject.hashtags && sampleProject.hashtags.length > 0) {
      const testHashtag = sampleProject.hashtags[0];
      console.log('Testing with hashtag:', testHashtag);
      
      const hashtagProjects = await db.collection('projects').find({
        hashtags: { $in: [testHashtag] }
      }).toArray();
      
      console.log(`Found ${hashtagProjects.length} projects with hashtag ${testHashtag}`);
      
      if (hashtagProjects.length > 0) {
        // Test aggregation
        const stats = {
          female: 0,
          male: 0,
          remoteImages: 0,
          hostessImages: 0,
          selfies: 0
        };
        
        hashtagProjects.forEach(project => {
          if (project.stats) {
            Object.keys(stats).forEach(key => {
              const value = project.stats[key];
              if (typeof value === 'number') {
                stats[key] = (stats[key] || 0) + value;
              }
            });
          }
        });
        
        console.log('Hashtag aggregated stats:');
        console.log('  Female:', stats.female);
        console.log('  Male:', stats.male);
        console.log('  Total Images:', stats.remoteImages + stats.hostessImages + stats.selfies);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

checkSIHFHashtags().catch(console.error);