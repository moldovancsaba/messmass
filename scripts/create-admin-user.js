// scripts/create-admin-user.js
// WHAT: Creates an initial admin user in the MongoDB database
// WHY: Allows local development access when no users exist yet

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function createAdminUser() {
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
    const users = db.collection('users');
    
    // Check if admin user already exists
    const existing = await users.findOne({ email: 'moldovancsaba@gmail.com' });
    if (existing) {
      console.log('✅ Admin user already exists:', existing.email);
      console.log('   User ID:', existing._id.toString());
      return;
    }
    
    // Create admin user with simple password (you should change this via UI later)
    const now = new Date().toISOString();
    const adminUser = {
      email: 'moldovancsaba@gmail.com',
      name: 'Csaba Moldovan',
      role: 'super-admin',
      password: 'admin123', // Simple password for initial setup
      createdAt: now,
      updatedAt: now
    };
    
    const result = await users.insertOne(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', adminUser.email);
    console.log('   Password:', adminUser.password);
    console.log('   User ID:', result.insertedId.toString());
    console.log('');
    console.log('🔐 You can now login at http://localhost:3000/admin/login');
    console.log('   with email: moldovancsaba@gmail.com');
    console.log('   and password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createAdminUser();
