// Explore database structure
const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri;
const DATABASE_NAME = config.dbName;

async function exploreDB() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   Database: ${DATABASE_NAME}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📂 Collections in database "${DATABASE_NAME}":`);
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} documents`);
    }
    
    // Check for chart-related collections
    const chartCollections = collections.filter(c => c.name.toLowerCase().includes('chart'));
    if (chartCollections.length > 0) {
      console.log(`\n📊 Chart-related collections:`);
      for (const coll of chartCollections) {
        console.log(`\n   Collection: ${coll.name}`);
        const sample = await db.collection(coll.name).findOne({});
        if (sample) {
          console.log(`   Sample document keys: ${Object.keys(sample).join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

exploreDB()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
