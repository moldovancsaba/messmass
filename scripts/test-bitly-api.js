#!/usr/bin/env node
// WHAT: Test Bitly links API to diagnose production issue
// WHY: User reports not seeing all 3,043 links on production

require('dotenv').config({ path: '.env.local', override: true });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'messmass';

async function testAPI() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connected');
    
    const db = client.db(dbName);
    const collection = db.collection('bitly_links');
    
    // Test 1: Total count
    const totalCount = await collection.countDocuments({});
    console.log('\n📊 Total links in database:', totalCount);
    
    // Test 2: Non-archived count
    const nonArchivedCount = await collection.countDocuments({ archived: { $ne: true } });
    console.log('📊 Non-archived links:', nonArchivedCount);
    
    // Test 3: Archived count
    const archivedCount = await collection.countDocuments({ archived: true });
    console.log('📊 Archived links:', archivedCount);
    
    // Test 4: Links with projectId (old one-to-many field)
    const withProjectId = await collection.countDocuments({ 
      archived: { $ne: true },
      projectId: { $ne: null } 
    });
    console.log('📊 Links with projectId (old field):', withProjectId);
    
    // Test 5: Links without projectId (unassigned in old schema)
    const withoutProjectId = await collection.countDocuments({ 
      archived: { $ne: true },
      projectId: null 
    });
    console.log('📊 Links without projectId (unassigned):', withoutProjectId);
    
    // Test 6: Check junction table associations
    const junctionCollection = db.collection('bitly_project_links');
    const junctionCount = await junctionCollection.countDocuments({});
    console.log('\n🔗 Junction table associations:', junctionCount);
    
    // Test 7: Simulate the API query WITH includeUnassigned=true
    const filter = { archived: { $ne: true } };
    // includeUnassigned: true means we DON'T add the projectId filter
    const apiResultCount = await collection.countDocuments(filter);
    console.log('\n🔍 API would return (includeUnassigned=true):', apiResultCount);
    
    // Test 8: Sample of links
    console.log('\n📝 Sample links (first 5):');
    const sample = await collection.find({ archived: { $ne: true } })
      .limit(5)
      .project({ bitlink: 1, title: 1, projectId: 1, archived: 1 })
      .toArray();
    
    sample.forEach((link, i) => {
      console.log(`  ${i+1}. ${link.bitlink}`);
      console.log(`     Title: ${link.title || 'N/A'}`);
      console.log(`     ProjectId: ${link.projectId || 'null (unassigned)'}`);
      console.log(`     Archived: ${link.archived || false}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testAPI();
