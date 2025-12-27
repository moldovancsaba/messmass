/**
 * Add Game and Registration Variables
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
  // Games Category
  { name: 'totalGames', alias: 'Total Games', category: 'games' },
  { name: 'gamesWithoutAds', alias: 'Games Without Ads', category: 'games' },
  { name: 'gamesWithAds', alias: 'Games With Ads', category: 'games' },
  { name: 'gamesWithoutSlideshow', alias: 'Games Without Slideshow', category: 'games' },
  { name: 'gamesWithSlideshow', alias: 'Games With Slideshow', category: 'games' },
  { name: 'gamesWithoutTech', alias: 'Games Without Tech', category: 'games' },
  { name: 'gamesWithSelfie', alias: 'Games With Selfie', category: 'games' },
  { name: 'gamesWithoutSelfie', alias: 'Games Without Selfie', category: 'games' },
  
  // Registration Category
  { name: 'userRegistration', alias: 'User Registration', category: 'registration' }
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
