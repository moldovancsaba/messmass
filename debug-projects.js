// Debug script to test MongoDB connection and projects API
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri-here';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function debugProjects() {
  console.log('🔍 Debugging Projects API...');
  
  if (!MONGODB_URI || MONGODB_URI === 'your-mongodb-uri-here') {
    console.error('❌ MONGODB_URI not set! Please set your MongoDB connection string.');
    console.log('Set it with: export MONGODB_URI="your-connection-string"');
    return;
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    console.log(`✅ Connected to database: ${MONGODB_DB}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    // Check projects collection
    const projectsCollection = db.collection('projects');
    const projectCount = await projectsCollection.estimatedDocumentCount();
    console.log(`📊 Projects collection has ${projectCount} documents`);
    
    // Get all projects
    const projects = await projectsCollection.find({}).toArray();
    console.log(`🔍 Found ${projects.length} projects:`);
    
    projects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.eventName} (${project.eventDate})`);
      console.log(`     ID: ${project._id}`);
      console.log(`     Stats: ${JSON.stringify(project.stats, null, 2)}`);
    });
    
    if (projects.length === 0) {
      console.log('⚠️  No projects found in database!');
      console.log('💡 Try creating a project through the main app first.');
    }
    
    await client.close();
    console.log('✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProjects();
