/**
 * Check Google Sheet UUID Status
 * 
 * WHAT: Verify googleSheetUuid field exists in project documents
 * WHY: Debug Pull sync issues
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const PARTNER_ID = '694a96990ad78323bea10660'; // Szerencsejáték Zrt.

async function checkUuids() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection('projects');

    // Find projects for this partner
    const projects = await projectsCollection.find({
      $or: [
        { partnerId: new ObjectId(PARTNER_ID) },
        { partnerId: PARTNER_ID },
        { partner1Id: new ObjectId(PARTNER_ID) }
      ]
    }).toArray();

    console.log(`\n📊 Found ${projects.length} projects for partner ${PARTNER_ID}\n`);

    let withUuid = 0;
    let withoutUuid = 0;

    projects.forEach((project, index) => {
      const hasUuid = !!project.googleSheetUuid;
      if (hasUuid) {
        withUuid++;
        console.log(`✅ ${index + 1}. ${project.eventName || 'Unnamed'}`);
        console.log(`   UUID: ${project.googleSheetUuid}`);
        console.log(`   Synced: ${project.googleSheetSyncedAt || 'Never'}`);
      } else {
        withoutUuid++;
        console.log(`❌ ${index + 1}. ${project.eventName || 'Unnamed'}`);
        console.log(`   Missing googleSheetUuid!`);
        console.log(`   _id: ${project._id}`);
      }
      console.log('');
    });

    console.log(`\n📊 Summary:`);
    console.log(`   With UUID: ${withUuid}`);
    console.log(`   Without UUID: ${withoutUuid}`);

    if (withoutUuid > 0) {
      console.log(`\n⚠️ ${withoutUuid} projects are missing googleSheetUuid!`);
      console.log(`   This will cause Pull to fail (created 0, updated 0)`);
      console.log(`   Run Setup again to write UUIDs to all projects.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkUuids()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
