// migrate-data.js - Create this file to fix the database field mismatch
const { MongoClient } = require('mongodb');

// Use the same MongoDB URI from your .env.local
const MONGODB_URI = 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';

async function migrateData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB Atlas');
    
    const db = client.db('messmass');
    const collection = db.collection('projects');
    
    // First, let's see what we have
    console.log('\n📊 Current projects in database:');
    const allProjects = await collection.find({}).toArray();
    console.log(`Found ${allProjects.length} projects`);
    
    if (allProjects.length === 0) {
      console.log('❌ No projects found in database');
      return;
    }
    
    // Show the structure of the first project
    console.log('\n🔍 Sample project structure:');
    console.log(JSON.stringify(allProjects[0], null, 2));
    
    // Check if migration is needed
    const needsMigration = allProjects.some(project => 
      project.remoteFans !== undefined || 
      project.onLocationFan !== undefined || 
      project.scarfFlags !== undefined
    );
    
    if (!needsMigration) {
      console.log('✅ Database is already using new field structure');
      return;
    }
    
    console.log('\n🚀 Starting migration...');
    
    // Migrate each project
    for (const project of allProjects) {
      const updates = {};
      let hasUpdates = false;
      
      // Map old field names to new ones
      if (project.remoteFans !== undefined) {
        updates.indoor = project.remoteFans;
        hasUpdates = true;
      }
      
      if (project.onLocationFan !== undefined) {
        updates.outdoor = project.onLocationFan;
        hasUpdates = true;
      }
      
      if (project.scarfFlags !== undefined) {
        updates.scarf = project.scarfFlags;
        hasUpdates = true;
      }
      
      // Add missing fields with default values
      if (project.stadium === undefined) {
        updates.stadium = 0;
        hasUpdates = true;
      }
      
      if (project.selfies === undefined) {
        updates.selfies = 0;
        hasUpdates = true;
      }
      
      if (project.flags === undefined) {
        updates.flags = 0;
        hasUpdates = true;
      }
      
      if (project.other === undefined) {
        updates.other = 0;
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        await collection.updateOne(
          { _id: project._id },
          { 
            $set: updates,
            $unset: {
              remoteFans: "",
              onLocationFan: "",
              scarfFlags: ""
            }
          }
        );
        
        console.log(`✅ Migrated project: ${project.eventName}`);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedProjects = await collection.find({}).toArray();
    const sampleMigrated = migratedProjects[0];
    
    console.log('Sample migrated project:');
    console.log(JSON.stringify(sampleMigrated, null, 2));
    
    // Calculate totals to verify
    if (sampleMigrated) {
      const totalImages = (sampleMigrated.indoor || 0) + (sampleMigrated.outdoor || 0) + (sampleMigrated.selfies || 0);
      const totalFans = (sampleMigrated.indoor || 0) + (sampleMigrated.outdoor || 0) + (sampleMigrated.stadium || 0);
      const totalMerch = (sampleMigrated.merched || 0) + (sampleMigrated.jersey || 0) + (sampleMigrated.scarf || 0) + 
                        (sampleMigrated.flags || 0) + (sampleMigrated.baseballCap || 0) + (sampleMigrated.other || 0);
      
      console.log(`\n📈 Sample totals after migration:`);
      console.log(`Images: ${totalImages}, Fans: ${totalFans}, Merch: ${totalMerch}`);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
    console.log('\n🔗 Database connection closed');
  }
}

// Run migration
migrateData().catch(console.error);