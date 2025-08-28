// Script to debug chart configurations - check all collections
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const DATABASE_NAME = 'messmass';

async function debugChartCollections() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    
    // List all collections
    console.log('\n=== All collections in database ===');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check different variations of chart configurations collection names
    const possibleCollectionNames = [
      'chartconfigurations',
      'chartConfigurations', 
      'chart-configurations',
      'chart_configurations'
    ];
    
    for (const collectionName of possibleCollectionNames) {
      try {
        console.log(`\n=== Checking collection: ${collectionName} ===`);
        const collection = db.collection(collectionName);
        const count = await collection.estimatedDocumentCount();
        console.log(`Document count: ${count}`);
        
        if (count > 0) {
          const docs = await collection.find({}).toArray();
          console.log('Documents:');
          docs.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.chartId || 'NO_CHART_ID'} - "${doc.title || 'NO_TITLE'}" (order: ${doc.order || 'NO_ORDER'})`);
          });
        }
      } catch (err) {
        console.log(`Collection ${collectionName} does not exist or error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

debugChartCollections();
