const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Test the connection
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB connected successfully');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function generateUniqueSlug(existingSlugs) {
  let slug = uuidv4();
  while (existingSlugs.has(slug)) {
    slug = uuidv4();
  }
  existingSlugs.add(slug);
  return slug;
}

async function migrateSlugs() {
  let client;
  
  try {
    client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Find all projects that don't have slugs
    const projectsWithoutSlugs = await collection.find({
      $or: [
        { viewSlug: { $exists: false } },
        { editSlug: { $exists: false } },
        { viewSlug: null },
        { editSlug: null }
      ]
    }).toArray();

    console.log(`📊 Found ${projectsWithoutSlugs.length} projects without slugs`);

    if (projectsWithoutSlugs.length === 0) {
      console.log('✅ All projects already have slugs. No migration needed.');
      return;
    }

    // Get all existing slugs to avoid conflicts
    const existingProjects = await collection.find({}).toArray();
    const existingSlugs = new Set();
    
    existingProjects.forEach(project => {
      if (project.viewSlug) existingSlugs.add(project.viewSlug);
      if (project.editSlug) existingSlugs.add(project.editSlug);
    });

    console.log(`🔑 Found ${existingSlugs.size} existing slugs to avoid conflicts`);

    // Update each project with generated slugs
    let updated = 0;
    for (const project of projectsWithoutSlugs) {
      try {
        const viewSlug = await generateUniqueSlug(existingSlugs);
        const editSlug = await generateUniqueSlug(existingSlugs);
        
        const result = await collection.updateOne(
          { _id: project._id },
          {
            $set: {
              viewSlug,
              editSlug,
              updatedAt: new Date().toISOString()
            }
          }
        );

        if (result.modifiedCount > 0) {
          updated++;
          console.log(`✅ Updated project "${project.eventName}" (${project._id})`);
          console.log(`   📊 View slug: ${viewSlug.substring(0, 8)}...`);
          console.log(`   ✏️  Edit slug: ${editSlug.substring(0, 8)}...`);
        }
      } catch (error) {
        console.error(`❌ Failed to update project ${project._id}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Updated ${updated} out of ${projectsWithoutSlugs.length} projects`);

    // Verify the migration
    const verificationCount = await collection.countDocuments({
      viewSlug: { $exists: true },
      editSlug: { $exists: true }
    });
    
    const totalCount = await collection.countDocuments();
    
    console.log(`\n🔍 Verification:`);
    console.log(`   Total projects: ${totalCount}`);
    console.log(`   Projects with slugs: ${verificationCount}`);
    
    if (verificationCount === totalCount) {
      console.log(`✅ All projects now have both viewSlug and editSlug!`);
    } else {
      console.log(`⚠️  Some projects still missing slugs: ${totalCount - verificationCount}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  console.log('🚀 Starting slug migration...');
  console.log('==================================\n');
  
  migrateSlugs().then(() => {
    console.log('\n==================================');
    console.log('🎯 Migration process completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateSlugs };
