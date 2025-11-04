import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkVars() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  const vars = await db.collection('variables_metadata')
    .find({ name: { $in: ['stats.fanSelfiePortrait4', 'stats.fanSelfiePortrait5'] } })
    .toArray();
  
  console.log(`Found ${vars.length} variables:`);
  vars.forEach(v => {
    console.log(`- ${v.name}: type=${v.type}, flags=${JSON.stringify(v.flags)}`);
  });
  
  if (vars.length === 0) {
    console.log('\n❌ Variables not found in database. They need to be created in KYC first.');
  }
  
  await client.close();
}

checkVars();
