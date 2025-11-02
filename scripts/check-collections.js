const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:\n');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check chart* collections
    const chartCollections = collections.filter(c => c.name.toLowerCase().includes('chart'));
    console.log('\n🎨 Chart-related collections:\n');
    chartCollections.forEach(col => console.log(`  - ${col.name}`));
  } finally {
    await client.close();
  }
}

checkCollections();
