const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('messmass');
    const chart = await db.collection('chartConfigurations').findOne({ chartId: 'gender-distribution' });
    
    console.log('\nGender Distribution Chart:');
    console.log(JSON.stringify(chart, null, 2));
    
  } finally {
    await client.close();
  }
}

check();
