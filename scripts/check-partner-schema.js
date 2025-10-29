const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const partner = await db.collection('partners').findOne({});
    
    if (!partner) {
      console.log('No partners found');
      return;
    }
    
    console.log('Partner schema:');
    console.log(JSON.stringify(partner, null, 2));
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
