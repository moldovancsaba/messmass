const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function dropLowercase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('chartconfigurations');
    const count = await collection.countDocuments();
    console.log(`\nchartconfigurations (lowercase) has ${count} documents`);
    
    if (count === 0) {
      console.log('Dropping empty collection...');
      await collection.drop();
      console.log('✅ Dropped successfully\n');
    } else {
      console.log('⚠️  Collection has data - NOT dropping\n');
    }
  } finally {
    await client.close();
  }
}

dropLowercase();
