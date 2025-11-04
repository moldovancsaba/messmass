const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = 'messmass';

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db(MONGODB_DB);
    const users = await db.collection('local_users').find({}).toArray();
    
    console.log(`Found ${users.length} users in 'local_users' collection:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  NO USERS FOUND\n');
      console.log('💡 Create a user with: node scripts/create-local-admin.js');
    } else {
      users.forEach(u => {
        console.log(`📧 ${u.email}`);
        console.log(`   Name: ${u.name}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   ID: ${u._id}`);
        console.log(`   Password: ${u.password || 'NOT SET'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
