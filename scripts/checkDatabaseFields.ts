// scripts/checkDatabaseFields.ts
import { MongoClient } from 'mongodb';

async function checkDatabaseField() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('projects');
    
    console.log('📊 Fetching project...');
    const project = await collection.findOne({}, { projection: { stats: 1, eventName: 1 } }) as any;
    
    if (project && project.stats) {
      console.log('\n' + '='.repeat(80));
      console.log('📊 Project:', project.eventName);
      console.log('='.repeat(80));
      
      console.log('\n🔍 ALL database field names in stats object:');
      const fields = Object.keys(project.stats).sort();
      fields.forEach(field => {
        console.log(`  - ${field}`);
      });
      
      console.log('\n📋 Specific field values:');
      console.log('  stats.female =', project.stats.female ?? 'undefined');
      console.log('  stats.male =', project.stats.male ?? 'undefined');
      console.log('  stats.Woman =', project.stats.Woman ?? 'undefined');
      console.log('  stats.Man =', project.stats.Man ?? 'undefined');
      console.log('  stats.FEMALE =', project.stats.FEMALE ?? 'undefined');
      console.log('  stats.remoteFans =', project.stats.remoteFans ?? 'undefined');
      console.log('  stats.remoteImages =', project.stats.remoteImages ?? 'undefined');
      console.log('  stats.stadium =', project.stats.stadium ?? 'undefined');
      
      console.log('\n✅ Database field name for female attendees: "female" (lowercase)');
      console.log('='.repeat(80));
    } else {
      console.log('❌ No projects found in database');
    }
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

checkDatabaseField().catch(console.error);
