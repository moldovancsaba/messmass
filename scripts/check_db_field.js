const { MongoClient } = require('mongodb');

async function checkDatabaseField() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('projects');
    
    const project = await collection.findOne({}, { projection: { stats: 1, eventName: 1 } });
    
    if (project && project.stats) {
      console.log('\n📊 Project:', project.eventName);
      console.log('\n🔍 Actual database field names in stats:');
      console.log(JSON.stringify(Object.keys(project.stats).sort(), null, 2));
      
      console.log('\n📋 Sample female-related stats:');
      console.log('stats.female =', project.stats.female);
      console.log('stats.male =', project.stats.male);
      console.log('stats.remoteFans =', project.stats.remoteFans);
      console.log('stats.remoteImages =', project.stats.remoteImages);
    }
  } finally {
    await client.close();
  }
}

checkDatabaseField();
