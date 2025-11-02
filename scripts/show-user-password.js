require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function showPassword() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('messmass');
  const users = db.collection('local_users');
  
  const user = await users.findOne({ email: 'moldovancsaba@gmail.com' });
  if (user) {
    console.log('Email:', user.email);
    console.log('Password:', user.password);
  } else {
    console.log('User not found');
  }
  
  await client.close();
}

showPassword();
