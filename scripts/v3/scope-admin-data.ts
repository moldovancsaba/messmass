import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmass';
const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1'; // Canonical Master Org ID

/**
 * WHAT: Scopes legacy Admin collections by Organization
 * WHY: Enable multi-tenant safety for Templates, Styles, and Metadata
 */
async function scopeAdminData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();

    const collectionsToScope = [
      'report_templates',
      'report_styles',
      'variables_metadata',
      'charts'
    ];

    for (const collectionName of collectionsToScope) {
      console.log(`\n📦 Scoping collection: ${collectionName}...`);
      
      // Update all documents that don't have an organizationId
      const result = await db.collection(collectionName).updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: new ObjectId(MASTER_ORG_ID) } }
      );

      console.log(`   - Modified ${result.modifiedCount} documents.`);
    }

    console.log('\n✨ Admin data scoping complete.');

  } catch (error) {
    console.error('❌ Scoping failed:', error);
  } finally {
    await client.close();
  }
}

scopeAdminData();
