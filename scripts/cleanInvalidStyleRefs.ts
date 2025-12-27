/**
 * Clean Invalid Style References
 * 
 * WHAT: Remove styleIdEnhanced references to non-existent report_styles
 * WHY: Prevents "Referenced report style does not exist" errors when editing events
 * HOW: Find all projects with styleIdEnhanced, check if style exists, unset if not
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function cleanInvalidStyleReferences() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in environment variables');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection('projects');
    const stylesCollection = db.collection('report_styles');

    // Get all valid style IDs
    const validStyles = await stylesCollection.find({}, { projection: { _id: 1 } }).toArray();
    const validStyleIds = new Set(validStyles.map(s => s._id.toString()));
    console.log(`📊 Found ${validStyleIds.size} valid report styles`);

    // Find all projects with styleIdEnhanced
    const projectsWithStyle = await projectsCollection.find({
      styleIdEnhanced: { $exists: true, $ne: null }
    }).toArray();

    console.log(`🔍 Found ${projectsWithStyle.length} projects with styleIdEnhanced`);

    let invalidCount = 0;
    let fixedCount = 0;

    for (const project of projectsWithStyle) {
      const styleId = project.styleIdEnhanced;
      const styleIdStr = styleId instanceof ObjectId ? styleId.toString() : String(styleId);

      if (!validStyleIds.has(styleIdStr)) {
        invalidCount++;
        console.log(`❌ Project ${project._id} has invalid styleIdEnhanced: ${styleIdStr}`);

        // Remove the invalid reference
        const result = await projectsCollection.updateOne(
          { _id: project._id },
          { $unset: { styleIdEnhanced: '' } }
        );

        if (result.modifiedCount > 0) {
          fixedCount++;
          console.log(`   ✅ Removed invalid styleIdEnhanced from project ${project._id}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total projects with style: ${projectsWithStyle.length}`);
    console.log(`   Invalid references found: ${invalidCount}`);
    console.log(`   References cleaned: ${fixedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanInvalidStyleReferences()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
