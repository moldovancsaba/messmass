import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI!);
(async () => {
  await client.connect();
  const db = client.db('messmass');
  const collections = await db.listCollections().toArray();
  const hasLocalUsers = collections.some(c => c.name === 'local_users');
  if (hasLocalUsers) {
    const count = await db.collection('local_users').countDocuments();
    console.log('local_users: ' + count + ' documents');
    if (count === 0) {
      await db.collection('local_users').drop();
      console.log('Dropped empty local_users collection');
    }
  } else {
    console.log('No local_users collection - already clean');
  }
  await client.close();
})();
