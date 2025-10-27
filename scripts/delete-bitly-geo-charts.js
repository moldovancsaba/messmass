const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const result = await db.collection('chartConfigurations').deleteMany({
      chartId: { $in: ['bitly-top-countries', 'bitly-top-country', 'bitly-countries-reached'] }
    });
    console.log(`Deleted ${result.deletedCount} chart config documents`);
  } finally {
    await client.close();
  }
}

cleanup();
