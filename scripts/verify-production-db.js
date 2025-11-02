// scripts/verify-production-db.js
// WHAT: Verifies MongoDB connection and lists all users
// WHY: Diagnose production authentication issues

const { MongoClient } = require('mongodb');

async function verifyProductionDB() {
  console.log('🔍 Verifying Production Database Connection...\n');
  
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI environment variable not found');
    console.log('Make sure .env.local is loaded or pass it directly');
    process.exit(1);
  }
  
  console.log('📡 MongoDB URI:', uri.replace(/:[^:@]+@/, ':***@')); // Hide password
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB\n');
    
    const db = client.db('messmass');
    const usersCollection = db.collection('local_users');
    
    // Count users
    const userCount = await usersCollection.countDocuments();
    console.log(`👥 Total users in database: ${userCount}\n`);
    
    // List all users (without passwords)
    const users = await usersCollection.find({}).toArray();
    console.log('📋 Users in database:');
    console.log('='.repeat(60));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'No name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Has password: ${user.password ? '✅ YES' : '❌ NO'}`);
      console.log(`   Password length: ${user.password ? user.password.length : 0} chars`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Check for the specific admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@messmass.com' });
    if (adminUser) {
      console.log('\n✅ admin@messmass.com user found');
      console.log(`   Password: ${adminUser.password}`);
    } else {
      console.log('\n❌ admin@messmass.com user NOT found');
    }
    
    // Check for moldovancsaba@gmail.com
    const moldovanUser = await usersCollection.findOne({ email: 'moldovancsaba@gmail.com' });
    if (moldovanUser) {
      console.log('\n✅ moldovancsaba@gmail.com user found');
      console.log(`   Password: ${moldovanUser.password}`);
    } else {
      console.log('\n❌ moldovancsaba@gmail.com user NOT found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

// Load .env.local
require('dotenv').config({ path: '.env.local' });

verifyProductionDB().catch(console.error);
