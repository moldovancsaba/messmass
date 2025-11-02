// scripts/reset-password-simple.js
// WHAT: Simple script to reset any user's password
// WHY: Help when locked out of admin

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function resetPassword() {
  const email = process.argv[2] || 'moldovancsaba@gmail.com';
  
  console.log('🔐 Resetting password for:', email);
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
    const usersCollection = db.collection('local_users');
    
    // Check if user exists
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user._id}`);
    console.log('');
    
    // Generate new password
    const newPassword = crypto.randomBytes(16).toString('hex');
    
    // Update password
    await usersCollection.updateOne(
      { email },
      { $set: { password: newPassword } }
    );
    
    console.log('✅ Password reset successful!');
    console.log('');
    console.log('=' .repeat(60));
    console.log('🔑 NEW CREDENTIALS:');
    console.log('=' .repeat(60));
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('=' .repeat(60));
    console.log('');
    console.log('📋 Save these credentials safely!');
    console.log('');
    console.log('🌐 Try logging in at:');
    console.log('   - https://www.messmass.com/admin/login');
    console.log('   - https://messmass.doneisbetter.com/admin/login');
    console.log('   - http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

resetPassword().catch(console.error);
