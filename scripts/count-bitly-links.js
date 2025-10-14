// Quick script to count Bitly links in database
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const count = await db.collection('bitly_links').countDocuments();
    console.log(`Total Bitly links in database: ${count}`);
  } finally {
    await client.close();
  }
}

main();
