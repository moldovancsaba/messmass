import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');

  const samples = await db.collection('variables_metadata').find({}).limit(5).toArray();

  console.log('📊 ACTUAL DATABASE VARIABLE FORMAT:\n');
  samples.forEach(v => {
    console.log(JSON.stringify({
      name: v.name,
      label: v.label,
      alias: v.alias,
      type: v.type,
      category: v.category,
      flags: v.flags,
      visibleInClicker: v.visibleInClicker,
      editableInManual: v.editableInManual,
      isSystem: v.isSystem,
      isSystemVariable: v.isSystemVariable
    }, null, 2));
    console.log('---');
  });

  await client.close();
}

checkSchema();
