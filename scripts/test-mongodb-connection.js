// scripts/test-mongodb-connection.js
// WHAT: Test MongoDB Atlas connection and list database contents
// WHY: Diagnose localhost connection issues and verify database structure

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'messmass';
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to MongoDB Atlas...');
  console.log('📦 Database:', dbName);
  console.log('🌐 URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    const db = client.db(dbName);
    
    // List all collections
    console.log('\n📋 Collections in database:');
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log('  ⚠️  No collections found');
    } else {
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`  - ${coll.name}: ${count} documents`);
      }
    }
    
    // Check admin_users collection specifically
    console.log('\n👤 Admin Users:');
    const adminUsers = await db.collection('admin_users').find({}).toArray();
    if (adminUsers.length === 0) {
      console.log('  ⚠️  No admin users found');
    } else {
      adminUsers.forEach(user => {
        console.log(`  - Email: ${user.email || 'N/A'}`);
        console.log(`    ID: ${user._id}`);
        console.log(`    Created: ${user.createdAt || 'N/A'}`);
      });
    }
    
    // Check projects collection
    console.log('\n📊 Projects:');
    const projectCount = await db.collection('projects').countDocuments();
    console.log(`  Total: ${projectCount} projects`);
    if (projectCount > 0) {
      const sampleProjects = await db.collection('projects')
        .find({})
        .limit(3)
        .project({ eventName: 1, eventDate: 1 })
        .toArray();
      console.log('  Sample projects:');
      sampleProjects.forEach(p => {
        console.log(`    - ${p.eventName} (${p.eventDate})`);
      });
    }
    
    // Check bitly_links collection
    console.log('\n🔗 Bitly Links:');
    const bitlyCount = await db.collection('bitly_links').countDocuments();
    console.log(`  Total: ${bitlyCount} links`);
    if (bitlyCount > 0) {
      const sampleLinks = await db.collection('bitly_links')
        .find({})
        .limit(3)
        .project({ bitlink: 1, title: 1 })
        .toArray();
      console.log('  Sample links:');
      sampleLinks.forEach(l => {
        console.log(`    - ${l.bitlink}: ${l.title}`);
      });
    }
    
    console.log('\n✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

testConnection();
