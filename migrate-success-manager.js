// migrate-success-manager.js - Add Success Manager fields to database
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';

const successManagerFields = {
  // Image Management
  approvedImages: 0,
  rejectedImages: 0,
  
  // Visit Tracking  
  visitQrCode: 0,
  visitShortUrl: 0,
  visitQrSearched: 0,
  visitWeb: 0,
  
  // Social Media Visits
  visitFacebook: 0,
  visitInstagram: 0,
  visitYoutube: 0,
  visitTiktok: 0,
  visitX: 0,
  visitTrustpilot: 0,
  
  // Event Performance
  eventAttendees: 0,
  eventTicketPurchases: 0,
  eventResultHome: 0,
  eventResultVisitor: 0,
  
  // Value Proposition
  eventValuePropositionVisited: 0,
  eventValuePropositionPurchases: 0
};

async function migrateSuccessManagerFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB Atlas');
    
    const db = client.db('messmass');
    const collection = db.collection('projects');
    
    // Check current projects
    console.log('\n📊 Current projects in database:');
    const allProjects = await collection.find({}).toArray();
    console.log(`Found ${allProjects.length} projects`);
    
    if (allProjects.length === 0) {
      console.log('❌ No projects found in database');
      return;
    }
    
    // Show sample project structure
    console.log('\n🔍 Sample project structure:');
    console.log(JSON.stringify(allProjects[0], null, 2));
    
    // Check if migration is needed
    const needsMigration = allProjects.some(project => 
      project.stats && project.stats.approvedImages === undefined
    );
    
    if (!needsMigration) {
      console.log('✅ Success Manager fields already exist in database');
      return;
    }
    
    console.log('\n🚀 Starting Success Manager fields migration...');
    
    // Migrate each project
    for (const project of allProjects) {
      if (project.stats) {
        // Add Success Manager fields to existing stats
        const updatedStats = {
          ...project.stats,
          ...successManagerFields
        };
        
        await collection.updateOne(
          { _id: project._id },
          { $set: { stats: updatedStats } }
        );
        
        console.log(`✅ Added Success Manager fields to: ${project.eventName}`);
      } else {
        // Create stats object with Success Manager fields
        await collection.updateOne(
          { _id: project._id },
          { $set: { stats: successManagerFields } }
        );
        
        console.log(`✅ Created stats with Success Manager fields for: ${project.eventName}`);
      }
    }
    
    console.log('\n🎉 Success Manager migration completed!');
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedProjects = await collection.find({}).toArray();
    const sampleMigrated = migratedProjects[0];
    
    if (sampleMigrated && sampleMigrated.stats) {
      console.log('\nSuccess Manager fields verification:');
      Object.keys(successManagerFields).forEach(field => {
        console.log(`  ${field}: ${sampleMigrated.stats[field] !== undefined ? '✅' : '❌'}`);
      });
      
      // Show sample of new structure
      console.log('\nSample Success Manager data:');
      console.log({
        approvedImages: sampleMigrated.stats.approvedImages || 0,
        rejectedImages: sampleMigrated.stats.rejectedImages || 0,
        visitQrCode: sampleMigrated.stats.visitQrCode || 0,
        eventAttendees: sampleMigrated.stats.eventAttendees || 0,
        eventTicketPurchases: sampleMigrated.stats.eventTicketPurchases || 0
      });
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
    console.log('\n🔗 Database connection closed');
  }
}

// Run migration
migrateSuccessManagerFields().catch(console.error);
