// WHAT: Fix all projects missing partner1 field
// WHY: BuilderMode needs partner templates to work correctly
// HOW: Assign projects to appropriate partners or create default partner

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixMissingPartners() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Find all projects without partner1
    const projectsWithoutPartner = await db.collection('projects').find({
      $or: [
        { partner1: { $exists: false } },
        { partner1: null }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${projectsWithoutPartner.length} projects without partner1`);
    
    if (projectsWithoutPartner.length === 0) {
      console.log('✅ All projects have partner assignments!');
      return;
    }
    
    // Get or create SEYU partner
    let seyuPartner = await db.collection('partners').findOne({ name: 'SEYU' });
    
    if (!seyuPartner) {
      console.log('\n🔧 Creating SEYU partner...');
      const result = await db.collection('partners').insertOne({
        name: 'SEYU',
        displayName: 'SEYU',
        description: 'Default partner for events without specific partner assignment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      seyuPartner = await db.collection('partners').findOne({ _id: result.insertedId });
      console.log('✅ Created SEYU partner:', seyuPartner?._id);
    }
    
    // Get WUKF partner for karate/martial arts events
    const wukfPartner = await db.collection('partners').findOne({ 
      $or: [
        { name: /WUKF/i },
        { displayName: /WUKF/i }
      ]
    });
    
    // Update projects
    let updatedCount = 0;
    
    for (const project of projectsWithoutPartner) {
      let partnerId = seyuPartner?._id;
      
      // Smart matching: assign WUKF to karate/martial arts events
      if (wukfPartner) {
        const eventName = project.eventName?.toLowerCase() || '';
        if (eventName.includes('karate') || 
            eventName.includes('martial') || 
            eventName.includes('championship') ||
            eventName.includes('wukf')) {
          partnerId = wukfPartner._id;
        }
      }
      
      await db.collection('projects').updateOne(
        { _id: project._id },
        { 
          $set: { 
            partner1: partnerId,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      updatedCount++;
      console.log(`✅ Assigned ${partnerId === wukfPartner?._id ? 'WUKF' : 'SEYU'} partner to: ${project.eventName}`);
    }
    
    console.log(`\n✅ Updated ${updatedCount} projects with partner assignments`);
    
  } catch (error) {
    console.error('❌ Error fixing partners:', error);
    throw error;
  } finally {
    await client.close();
  }
}

fixMissingPartners()
  .then(() => {
    console.log('\n✅ Fix complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  });
