// scripts/remove-home-visitor-categories.js
// WHAT: Remove obsolete "home" and "visitor" hashtag categories
// WHY: Sports Match Builder now handles home/visitor team logic, making these categories redundant

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Obsolete hashtag category names
// WHY: Sports Match Builder (🤝 Sports Match) replaces this manual categorization
const OBSOLETE_CATEGORIES = ['home', 'visitor'];

async function removeHomeVisitorCategories() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Step 1: Count usage before deletion
    console.log('\n📊 Analyzing usage before cleanup...');
    
    const projectsWithHome = await db.collection('projects').countDocuments({
      'categorizedHashtags.home': { $exists: true }
    });
    
    const projectsWithVisitor = await db.collection('projects').countDocuments({
      'categorizedHashtags.visitor': { $exists: true }
    });
    
    console.log(`   - ${projectsWithHome} projects use "home" category`);
    console.log(`   - ${projectsWithVisitor} projects use "visitor" category`);
    
    // Step 2: Delete categories from hashtag_categories collection
    console.log('\n🗑️  Deleting hashtag categories...');
    const categoryResult = await db.collection('hashtag_categories').deleteMany({
      name: { $in: OBSOLETE_CATEGORIES }
    });
    console.log(`   Deleted ${categoryResult.deletedCount} categories`);
    
    // Step 3: Remove categorizedHashtags.home and categorizedHashtags.visitor from all projects
    console.log('\n📁 Cleaning project hashtags...');
    const projectResult = await db.collection('projects').updateMany(
      {},
      { 
        $unset: { 
          'categorizedHashtags.home': '',
          'categorizedHashtags.visitor': ''
        } 
      }
    );
    console.log(`   Updated ${projectResult.modifiedCount} projects`);
    
    // Step 4: Verify cleanup
    console.log('\n✅ Verifying cleanup...');
    
    const remainingHome = await db.collection('projects').countDocuments({
      'categorizedHashtags.home': { $exists: true }
    });
    
    const remainingVisitor = await db.collection('projects').countDocuments({
      'categorizedHashtags.visitor': { $exists: true }
    });
    
    const remainingCategories = await db.collection('hashtag_categories').countDocuments({
      name: { $in: OBSOLETE_CATEGORIES }
    });
    
    if (remainingHome === 0 && remainingVisitor === 0 && remainingCategories === 0) {
      console.log('   ✅ Cleanup successful - all references removed');
    } else {
      console.warn('   ⚠️  Some references remain:');
      console.warn(`      - Categories: ${remainingCategories}`);
      console.warn(`      - Projects with home: ${remainingHome}`);
      console.warn(`      - Projects with visitor: ${remainingVisitor}`);
    }
    
    // Step 5: Summary
    console.log('\n📝 Summary:');
    console.log(`   - ${categoryResult.deletedCount} categories deleted`);
    console.log(`   - ${projectResult.modifiedCount} projects cleaned`);
    console.log(`   - ${OBSOLETE_CATEGORIES.length} category types removed from system`);
    
    console.log('\n💡 Why: Sports Match Builder (🤝 Sports Match) now handles home/visitor');
    console.log('   team logic through partner selection, making manual hashtag');
    console.log('   categorization unnecessary.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the cleanup
removeHomeVisitorCategories();
