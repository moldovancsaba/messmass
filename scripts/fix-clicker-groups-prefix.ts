// scripts/fix-clicker-groups-prefix.ts
// WHAT: Fix variable groups to remove stats. prefix from variable names
// WHY: Groups use "stats.remoteImages" but variables_metadata uses "remoteImages"
// HOW: Strip stats. prefix from all variables arrays in variablesGroups collection

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixClickerGroups() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔧 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const groupsCollection = db.collection('variablesGroups');

    console.log('\n📊 Fetching all variable groups...');
    const groups = await groupsCollection.find({}).toArray();
    console.log(`Found ${groups.length} groups`);

    let updatedCount = 0;
    let totalVarsFixed = 0;

    for (const group of groups) {
      const originalVars = group.variables || [];
      const fixedVars = originalVars.map((varName: string) => {
        // Remove stats. prefix if present
        if (varName.startsWith('stats.')) {
          totalVarsFixed++;
          return varName.substring(6); // Remove "stats."
        }
        return varName;
      });

      // Check if any changes were made
      const hasChanges = JSON.stringify(originalVars) !== JSON.stringify(fixedVars);

      if (hasChanges) {
        console.log(`\n  Updating Group ${group.groupOrder}:`);
        console.log(`    Before: ${originalVars.slice(0, 3).join(', ')}${originalVars.length > 3 ? '...' : ''}`);
        console.log(`    After:  ${fixedVars.slice(0, 3).join(', ')}${fixedVars.length > 3 ? '...' : ''}`);

        await groupsCollection.updateOne(
          { _id: group._id },
          {
            $set: {
              variables: fixedVars,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        updatedCount++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`  - ${updatedCount} groups updated`);
    console.log(`  - ${totalVarsFixed} variable references fixed`);
    
    if (updatedCount === 0) {
      console.log('\n✅ No changes needed - all groups already use correct format');
    } else {
      console.log('\n✅ Groups now match variables_metadata naming (no stats. prefix)');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixClickerGroups().catch(console.error);
