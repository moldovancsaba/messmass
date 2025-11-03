import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function deleteVar() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  await db.collection('variables_metadata').deleteOne({ name: 'stats.fanSelfiePortrait1' });
  console.log('✅ Deleted stats.fanSelfiePortrait1');
  
  await client.close();
}

deleteVar();
