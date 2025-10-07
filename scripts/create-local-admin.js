// scripts/create-local-admin.js
// WHAT: Create a local admin user for localhost development
// WHY: Production and localhost use different databases, need local credentials

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function createLocalAdmin() {
  const email = process.argv[2] || 'admin@messmass.com';
  const name = process.argv[3] || 'Local Admin';
  
  console.log('👤 Creating local admin user...');
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name}`);
  console.log('');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('messmass');
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  User already exists: ${email}`);
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log('');
      console.log('💡 To reset password, run:');
      console.log(`   node scripts/reset-password-simple.js ${email}`);
      process.exit(0);
    }
    
    // Generate password
    const password = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    
    // Create user
    const newUser = {
      email: email.toLowerCase(),
      name,
      role: 'super-admin',
      password,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    console.log('✅ User created successfully!');
    console.log(`   User ID: ${result.insertedId}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Save these credentials safely!');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/admin/login');
    console.log('');
    console.log('💡 You can also login with just: admin');
    console.log('   (if email is admin@messmass.com)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createLocalAdmin().catch(console.error);
