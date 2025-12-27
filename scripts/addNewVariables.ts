/**
 * Add New KYC Variables (Hostess Reg, CTA Visits)
 * 
 * WHAT: Insert new system variables into variables_metadata collection
 * WHY: Make them available in Clicker and Manual edit modes
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

const NEW_VARIABLES = [
  // Registration
  { name: 'userRegistrationHostess', alias: 'User Registration by Hostess', category: 'registration' },
  
  // Visits CTA
  { name: 'visitCta1', alias: 'Visit CTA 1', category: 'visits' },
  { name: 'visitCta2', alias: 'Visit CTA 2', category: 'visits' },
  { name: 'visitCta3', alias: 'Visit CTA 3', category: 'visits' },
  
  // Ensure others are present (just in case)
  { name: 'socialVisit', alias: 'Social Visits', category: 'visits' },
  { name: 'outdoor', alias: 'Outdoor Fans', category: 'location' }
];

async function addVariables() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const collection = db.collection('variables_metadata');

    for (const variable of NEW_VARIABLES) {
      const result = await collection.updateOne(
        { name: variable.name },
        {
          $set: {
            name: variable.name,
            alias: variable.alias,
            type: 'number',
            category: variable.category,
            visibleInClicker: true,
            editableInManual: true,
            isSystemVariable: true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      
      console.log(`✅ Upserted variable: ${variable.name} (${result.upsertedCount ? 'Created' : 'Updated'})`);
    }

    console.log('\n✅ All variables added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

addVariables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
