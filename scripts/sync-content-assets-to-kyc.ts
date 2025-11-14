// scripts/sync-content-assets-to-kyc.ts
// WHAT: Automatically create KYC variables from Content Library assets
// WHY: Content assets need corresponding variables in KYC to appear in Manual Edit
// HOW: For each content asset (Variable Definition mode), create matching variable in variables_metadata

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function syncContentAssetsToKYC() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const assetsCollection = db.collection('content_assets');
    const variablesCollection = db.collection('variables_metadata');
    
    // WHAT: Find all Variable Definition content assets (including legacy)
    // WHY: Only Variable Definitions need KYC variables (Global Assets don't)
    // HOW: Match either isVariable: true OR isLegacy: true
    const assets = await assetsCollection.find({ 
      $or: [{ isVariable: true }, { isLegacy: true }] 
    }).toArray();
    
    console.log(`\n📊 Found ${assets.length} Variable Definition content assets\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (const asset of assets) {
      // WHAT: Use linkedVariable for legacy assets, slug for new assets
      // WHY: Legacy assets store the actual stats field name in linkedVariable
      // HOW: linkedVariable = 'reportImage11', slug = 'report-image-11'
      const variableName = asset.linkedVariable || asset.slug;
      
      // WHAT: Check if variable already exists
      // WHY: Prevent duplicates on re-runs
      const existing = await variablesCollection.findOne({ name: variableName });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${variableName} (already exists in KYC)`);
        skipped++;
        continue;
      }
      
      // WHAT: Create KYC variable document
      // WHY: Makes the variable usable in Clicker, Manual Edit, and Algorithms
      // WHAT: Determine variable type based on content asset type
      // WHY: Images need 'textmedia', texts need 'textarea'
      let variableType = 'count';
      if (asset.type === 'image') {
        variableType = 'textmedia'; // Image URL storage
      } else if (asset.type === 'text') {
        variableType = 'textarea'; // Multi-line text
      }
      
      const variable = {
        name: variableName,
        label: asset.title, // Use content asset title as display label
        alias: asset.title, // UI display name (editable in KYC)
        type: variableType,
        category: asset.category || 'Content',
        flags: {
          visibleInClicker: true, // CHANGED: Enable in Clicker UI (was false)
          editableInManual: true, // Enable in Manual Edit
        },
        isSystem: false, // Custom variable
        derived: false,
        order: 999, // Display at end of category
        linkedContentAsset: asset.slug, // WHAT: Link back to content asset
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await variablesCollection.insertOne(variable);
      console.log(`✅ Created KYC variable: ${variableName} → "${asset.title}" (linked to [${asset.type.toUpperCase()}:${asset.slug}])`);
      created++;
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Created: ${created} KYC variables`);
    console.log(`   ⏭️  Skipped: ${skipped} existing variables`);
    console.log(`   📌 Total: ${assets.length} content assets processed`);
    
    console.log('\n🎉 Content assets synced to KYC successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Visit http://localhost:3000/admin/kyc');
    console.log('   2. You should see the new variables');
    console.log('   3. Add them to Variable Groups at /admin/clicker-manager');
    console.log('   4. They will then appear in Manual Edit sections');
    
  } catch (error) {
    console.error('❌ Error syncing content assets to KYC:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run sync
syncContentAssetsToKYC();
