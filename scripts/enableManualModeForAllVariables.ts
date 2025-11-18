// WHAT: Enable editableInManual flag for all non-derived variables
// WHY: User can't see any variables in Manual mode because editableInManual=false
// HOW: Update all variables in variables_metadata collection

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function enableManualMode() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const collection = db.collection('variables_metadata');

    // WHAT: Update all non-derived variables to have editableInManual=true
    // WHY: Manual mode filters by this flag, so if it's false, variables won't appear
    const result = await collection.updateMany(
      { 
        type: { $ne: 'derived' }  // Don't enable for derived variables
      },
      {
        $set: {
          'flags.editableInManual': true,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} variables`);
    console.log(`   Matched: ${result.matchedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

enableManualMode();
