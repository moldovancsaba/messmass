import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkVar() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  const v = await db.collection('variables_metadata')
    .findOne({ name: 'stats.fanSelfiePortrait4' });
  
  console.log('Full variable structure:');
  console.log(JSON.stringify(v, null, 2));
  
  await client.close();
}

checkVar();
