// Migration script to update existing projects from old to new structure
// Run this once to migrate your existing data

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const MONGODB_DB = 'messmass';

async function migrateProjects() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    console.log('📊 Fetching projects to migrate...');
    const projects = await collection.find({}).toArray();
    console.log(`Found ${projects.length} projects to migrate`);
    
    for (const project of projects) {
      console.log(`\n🔄 Migrating project: ${project.eventName}`);
      
      // Create new stats structure based on old data
      const newStats = {
        // Images - keep existing + add selfies as 0
        remoteImages: project.stats.remoteImages || 0,
        hostessImages: project.stats.hostessImages || 0,
        selfies: 0, // New field, default to 0
        
        // Fans - migrate old fields to new names + add stadium
        indoor: project.stats.remoteFans || 0,      // remoteFans → indoor
        outdoor: project.stats.onLocationFan || 0,  // onLocationFan → outdoor
        stadium: 0, // New field, default to 0
        
        // Gender - keep existing
        female: project.stats.female || 0,
        male: project.stats.male || 0,
        
        // Age - keep existing
        genAlpha: project.stats.genAlpha || 0,
        genYZ: project.stats.genYZ || 0,
        genX: project.stats.genX || 0,
        boomer: project.stats.boomer || 0,
        
        // Merchandise - migrate scarfFlags + add new fields
        merched: project.stats.merched || 0,
        jersey: project.stats.jersey || 0,
        scarf: project.stats.scarfFlags || 0,  // scarfFlags → scarf
        flags: 0, // New field, default to 0
        baseballCap: project.stats.baseballCap || 0,
        other: 0  // New field, default to 0
      };
      
      console.log('Old stats:', {
        remoteFans: project.stats.remoteFans,
        onLocationFan: project.stats.onLocationFan,
        scarfFlags: project.stats.scarfFlags
      });
      
      console.log('New stats:', {
        indoor: newStats.indoor,
        outdoor: newStats.outdoor,
        stadium: newStats.stadium,
        scarf: newStats.scarf,
        flags: newStats.flags,
        selfies: newStats.selfies,
        other: newStats.other
      });
      
      // Update the project with new structure
      const result = await collection.updateOne(
        { _id: project._id },
        { 
          $set: { 
            stats: newStats,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      console.log(`✅ ${project.eventName} migrated (${result.modifiedCount} document modified)`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('All projects have been updated to the new structure.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
migrateProjects();