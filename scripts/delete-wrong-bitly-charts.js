const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const result = await db.collection('charts').deleteMany({
      chartId: { $in: ['bitly-top-countries', 'bitly-top-country', 'bitly-countries-reached'] }
    });
    console.log(`Deleted ${result.deletedCount} incorrect chart documents from 'charts' collection`);
  } finally {
    await client.close();
  }
}

cleanup();
