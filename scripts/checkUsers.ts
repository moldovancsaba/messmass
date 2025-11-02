import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

(async () => {
  await client.connect();
  const db = client.db('messmass');
  
  console.log('📊 Users Collection Status:');
  const count = await db.collection('users').countDocuments();
  console.log(`   Documents: ${count}`);
  
  if (count > 0) {
    const users = await db.collection('users').find({}).limit(3).toArray();
    console.log('\n👥 Sample users:');
    users.forEach((u: any) => console.log(`   - ${u.email} (${u.role})`));
  }
  
  await client.close();
})();
