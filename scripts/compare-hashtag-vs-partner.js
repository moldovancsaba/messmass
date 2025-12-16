// Compare hashtag vs partner data structures to find the difference
// Run with: node scripts/compare-hashtag-vs-partner.js

const { MongoClient, ObjectId } = require('mongodb');

async function compareDataStructures() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Comparing hashtag vs partner data structures...\n');
    
    // ==========================================
    // 1. HASHTAG DATA (WORKING)
    // ==========================================
    console.log('📊 HASHTAG DATA (WORKING):');
    
    // Simulate hashtag aggregation (like filter page)
    const hashtagProjects = await db.collection('projects').find({
      hashtags: { $in: ['partner:sihf'] }
    }).toArray();
    
    console.log(`Found ${hashtagProjects.length} projects with hashtag partner:sihf`);
    
    // Aggregate hashtag stats (same as filter page)
    const hashtagStats = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      indoor: 0,
      outdoor: 0,
      stadium: 0,
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
      eventAttendees: 0
    };
    
    hashtagProjects.forEach(project => {
      if (project.stats) {
        Object.keys(project.stats).forEach(key => {
          const value = project.stats[key];
          if (typeof value === 'number') {
            hashtagStats[key] = (hashtagStats[key] || 0) + value;
          }
        });
      }
    });
    
    console.log('Hashtag aggregate stats:');
    console.log('  Total Images:', hashtagStats.remoteImages + hashtagStats.hostessImages + hashtagStats.selfies);
    console.log('  Total Fans:', hashtagStats.female + hashtagStats.male);
    console.log('  Female:', hashtagStats.female);
    console.log('  Male:', hashtagStats.male);
    console.log('  Merched:', hashtagStats.merched);
    console.log('  Event Attendees:', hashtagStats.eventAttendees);
    
    // ==========================================
    // 2. PARTNER DATA (NOT WORKING)
    // ==========================================
    console.log('\n📊 PARTNER DATA (NOT WORKING):');
    
    // Get partner
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }
    
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
    
    console.log(`Found ${partnerEvents.length} events for partner ${partner.name}`);
    
    // Aggregate partner stats (same logic as partner page)
    const partnerStats = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      indoor: 0,
      outdoor: 0,
      stadium: 0,
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
      eventAttendees: 0
    };
    
    partnerEvents.forEach(event => {
      if (event.stats) {
        Object.keys(event.stats).forEach(key => {
          const value = event.stats[key];
          if (typeof value === 'number') {
            partnerStats[key] = (partnerStats[key] || 0) + value;
          }
        });
      }
    });
    
    console.log('Partner aggregate stats:');
    console.log('  Total Images:', partnerStats.remoteImages + partnerStats.hostessImages + partnerStats.selfies);
    console.log('  Total Fans:', partnerStats.female + partnerStats.male);
    console.log('  Female:', partnerStats.female);
    console.log('  Male:', partnerStats.male);
    console.log('  Merched:', partnerStats.merched);
    console.log('  Event Attendees:', partnerStats.eventAttendees);
    
    // ==========================================
    // 3. COMPARISON
    // ==========================================
    console.log('\n🔍 COMPARISON:');
    
    const hashtagTotal = hashtagStats.female + hashtagStats.male;
    const partnerTotal = partnerStats.female + partnerStats.male;
    
    console.log('Hashtag total fans:', hashtagTotal);
    console.log('Partner total fans:', partnerTotal);
    console.log('Match:', hashtagTotal === partnerTotal ? '✅' : '❌');
    
    // Check if they're the same events
    const hashtagEventIds = hashtagProjects.map(p => p._id.toString()).sort();
    const partnerEventIds = partnerEvents.map(e => e._id.toString()).sort();
    
    console.log('\nEvent IDs comparison:');
    console.log('Hashtag events:', hashtagEventIds.length);
    console.log('Partner events:', partnerEventIds.length);
    
    const sameEvents = JSON.stringify(hashtagEventIds) === JSON.stringify(partnerEventIds);
    console.log('Same events:', sameEvents ? '✅' : '❌');
    
    if (!sameEvents) {
      console.log('Hashtag event IDs:', hashtagEventIds);
      console.log('Partner event IDs:', partnerEventIds);
    }
    
    // ==========================================
    // 4. CHART CONFIGURATIONS TEST
    // ==========================================
    console.log('\n📊 CHART CONFIGURATIONS TEST:');
    
    const chartConfigs = await db.collection('chart_configurations').find({ 
      isActive: true 
    }).limit(3).toArray();
    
    console.log(`Testing with ${chartConfigs.length} chart configurations`);
    
    chartConfigs.forEach(config => {
      console.log(`\nChart: ${config.title}`);
      console.log('Elements:', config.elements?.length || 0);
      
      if (config.elements && config.elements.length > 0) {
        config.elements.forEach(element => {
          console.log(`  Element: ${element.label} = ${element.formula}`);
          
          // Test formula evaluation with both datasets
          if (element.formula && element.formula.includes('stats.')) {
            const fieldMatch = element.formula.match(/stats\.([a-zA-Z0-9]+)/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const hashtagValue = hashtagStats[fieldName] || 0;
              const partnerValue = partnerStats[fieldName] || 0;
              
              console.log(`    Hashtag ${fieldName}: ${hashtagValue}`);
              console.log(`    Partner ${fieldName}: ${partnerValue}`);
              console.log(`    Match: ${hashtagValue === partnerValue ? '✅' : '❌'}`);
            }
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

compareDataStructures().catch(console.error);