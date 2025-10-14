// scripts/list-users.js
// WHAT: List all users in the database and show their details
// WHY: Debug authentication issues

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function listUsers() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'messmass';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log('\n👤 All Users in database:');
    console.log('='.repeat(80));
    
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      console.log('\n💡 To create the first admin user, run: node scripts/create-admin-user.js');
    } else {
      users.forEach((user, index) => {
        console.log(`\n[${index + 1}] User:`);
        console.log(`  _id: ${user._id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name || 'N/A'}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Password: ${user.password ? '***' + user.password.slice(-6) : 'N/A'}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log(`  Updated: ${user.updatedAt || 'N/A'}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`Total: ${users.length} user(s)`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await client.close();
  }
}

listUsers();
