const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function migrateHashtags() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  let client = null;

  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection('projects');
    const hashtagSlugsCollection = db.collection('hashtag_slugs');

    console.log('📊 Fetching all projects to extract hashtags...');
    const projects = await projectsCollection.find({}).toArray();
    
    // Calculate hashtag counts
    const hashtagCounts = {};
    projects.forEach(project => {
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach(hashtag => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      }
    });

    const uniqueHashtags = Object.keys(hashtagCounts);
    console.log(`📝 Found ${uniqueHashtags.length} unique hashtags`);

    let created = 0;
    let existing = 0;

    for (const hashtag of uniqueHashtags) {
      // Check if slug already exists
      const existingSlug = await hashtagSlugsCollection.findOne({ hashtag });
      
      if (existingSlug) {
        console.log(`  ✅ Slug already exists for #${hashtag}: ${existingSlug.slug}`);
        existing++;
      } else {
        // Create new UUID slug
        const newSlug = uuidv4();
        await hashtagSlugsCollection.insertOne({
          hashtag,
          slug: newSlug,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`  🆕 Created new slug for #${hashtag}: ${newSlug}`);
        created++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  - ${created} new UUIDs created`);
    console.log(`  - ${existing} existing UUIDs found`);
    console.log(`  - ${uniqueHashtags.length} total hashtags processed`);
    
    console.log('\n✅ Hashtag UUID migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the migration
migrateHashtags();
