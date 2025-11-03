import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// WHAT: Delete specific variables by name
// WHY: Clean up old/wrong variables created during testing
const VARIABLES_TO_DELETE = [
  'fanSelfiePortrait1',
  'fanSelfiePortrait2',
  'fanSelfiePortrait3'
];

async function deleteVariables() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  const collection = db.collection('variables_metadata');

  console.log(`🗑️  Deleting ${VARIABLES_TO_DELETE.length} variables:\n`);
  
  for (const name of VARIABLES_TO_DELETE) {
    const result = await collection.deleteOne({ name });
    if (result.deletedCount > 0) {
      console.log(`✅ Deleted: ${name}`);
    } else {
      console.log(`⏭️  Not found: ${name}`);
    }
  }
  
  console.log('\n✅ Cleanup complete');
  await client.close();
}

deleteVariables();
