// scripts/diagnose-clicker.ts
// WHAT: Diagnostic script to check why clicker buttons aren't showing
// WHY: Debug data flow between variablesGroups and variables_metadata collections
// HOW: Connect to MongoDB and inspect both collections

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function diagnoseClicker() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔍 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    console.log('\n📊 Checking variablesGroups collection...');
    const groupsCollection = db.collection('variablesGroups');
    const groups = await groupsCollection.find({}).sort({ groupOrder: 1 }).toArray();
    
    console.log(`✅ Found ${groups.length} groups`);
    if (groups.length === 0) {
      console.log('⚠️  NO GROUPS FOUND - This is the problem!');
      console.log('💡 Solution: Go to /admin/clicker-manager and click "Seed Defaults"');
    } else {
      groups.forEach((group: any) => {
        console.log(`\n  Group ${group.groupOrder}:`);
        console.log(`    - visibleInClicker: ${group.visibleInClicker !== false ? '✅ true' : '❌ false'}`);
        console.log(`    - visibleInManual: ${group.visibleInManual !== false ? '✅ true' : '❌ false'}`);
        console.log(`    - chartId: ${group.chartId || 'none'}`);
        console.log(`    - titleOverride: ${group.titleOverride || 'none'}`);
        console.log(`    - variables (${group.variables.length}): ${group.variables.slice(0, 5).join(', ')}${group.variables.length > 5 ? '...' : ''}`);
      });
    }

    console.log('\n📊 Checking variables_metadata collection...');
    const varsCollection = db.collection('variables_metadata');
    const variables = await varsCollection.find({}).toArray();
    
    console.log(`✅ Found ${variables.length} variables`);
    const clickerVisible = variables.filter((v: any) => v.visibleInClicker === true);
    const manualEditable = variables.filter((v: any) => v.editableInManual === true);
    console.log(`  - ${clickerVisible.length} visible in clicker`);
    console.log(`  - ${manualEditable.length} editable in manual`);

    if (variables.length === 0) {
      console.log('⚠️  NO VARIABLES FOUND - Need to seed variables!');
      console.log('💡 Solution: Run `npm run seed:variables`');
    }

    // Cross-check: variables in groups vs variables_metadata
    if (groups.length > 0 && variables.length > 0) {
      console.log('\n🔗 Cross-checking group variables against metadata...');
      const allGroupVars = new Set<string>();
      groups.forEach((g: any) => g.variables.forEach((v: string) => allGroupVars.add(v)));
      
      const varNames = new Set(variables.map((v: any) => v.name));
      const missingInMetadata: string[] = [];
      const foundInMetadata: string[] = [];
      
      allGroupVars.forEach(groupVar => {
        if (!varNames.has(groupVar)) {
          missingInMetadata.push(groupVar);
        } else {
          foundInMetadata.push(groupVar);
        }
      });

      console.log(`  ✅ ${foundInMetadata.length} group variables found in metadata`);
      if (missingInMetadata.length > 0) {
        console.log(`  ⚠️  ${missingInMetadata.length} group variables NOT found in metadata:`);
        missingInMetadata.forEach(v => console.log(`    - ${v}`));
        console.log('💡 Solution: Update groups to use correct variable names OR seed variables');
      }

      // Check flags
      console.log('\n🚩 Checking visibility flags...');
      let invisibleCount = 0;
      groups.forEach((group: any) => {
        if (group.visibleInClicker !== false) {
          group.variables.forEach((varName: string) => {
            const varMeta = variables.find((v: any) => v.name === varName);
            if (varMeta && !varMeta.visibleInClicker) {
              console.log(`  ⚠️  Variable "${varName}" in group ${group.groupOrder} has visibleInClicker=false`);
              invisibleCount++;
            }
          });
        }
      });
      
      if (invisibleCount > 0) {
        console.log(`💡 Solution: Go to /admin/kyc and enable "Visible in Clicker" for ${invisibleCount} variables`);
      } else {
        console.log('  ✅ All group variables have correct visibility flags');
      }
    }

    console.log('\n✨ Diagnosis complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await client.close();
  }
}

diagnoseClicker().catch(console.error);
