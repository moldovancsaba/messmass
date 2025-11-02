import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

(async () => {
  await client.connect();
  const db = client.db('messmass');
  
  console.log('=== variablesConfig (legacy) - Sample ===');
  const legacy = await db.collection('variablesConfig').find({}).limit(5).toArray();
  legacy.forEach((v: any) => console.log(`  ${v.name} | ${v.category} | visible: ${v.visibleInClicker}`));
  
  console.log('\n=== variables_metadata (modern) - Sample ===');
  const modern = await db.collection('variables_metadata').find({}).limit(5).toArray();
  modern.forEach((v: any) => console.log(`  ${v.name} | ${v.category} | visible: ${v.visibleInClicker}`));
  
  console.log('\n=== Looking for "female" in both ===');
  const legacyFemale = await db.collection('variablesConfig').findOne({ name: 'female' });
  const modernFemale = await db.collection('variables_metadata').findOne({ name: 'female' });
  console.log('Legacy:', legacyFemale ? 'Found' : 'Not found');
  console.log('Modern:', modernFemale ? 'Found' : 'Not found');
  
  await client.close();
})();
