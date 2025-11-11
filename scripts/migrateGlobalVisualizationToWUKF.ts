/**
 * Migration: Copy Global Visualization Config to WUKF Template
 * 
 * WHAT: Migrates existing data-blocks and grid-settings to WUKF's report template
 * WHY: Preserve WUKF's existing report layout in the new template system
 * HOW: 
 * 1. Fetch all data blocks
 * 2. Fetch grid settings
 * 3. Find WUKF template (by name or partner association)
 * 4. Update template with dataBlocks references and gridSettings
 */

import { getDb } from '../lib/db';

async function migrateGlobalVisualizationToWUKF() {
  console.log('🚀 Starting migration: Global Visualization → WUKF Template\n');

  try {
    const db = await getDb();
    
    // Step 1: Fetch all data blocks
    console.log('📦 Fetching data blocks...');
    const dataBlocks = await db.collection('data_blocks').find({}).toArray();
    console.log(`   Found ${dataBlocks.length} data blocks\n`);

    if (dataBlocks.length === 0) {
      console.log('⚠️  No data blocks found. Nothing to migrate.');
      return;
    }

    // Step 2: Fetch grid settings
    console.log('📐 Fetching grid settings...');
    const gridSettingsDoc = await db.collection('grid_settings').findOne({});
    const gridSettings = gridSettingsDoc ? {
      desktopUnits: gridSettingsDoc.desktopUnits || 12,
      tabletUnits: gridSettingsDoc.tabletUnits || 8,
      mobileUnits: gridSettingsDoc.mobileUnits || 4
    } : {
      desktopUnits: 12,
      tabletUnits: 8,
      mobileUnits: 4
    };
    console.log(`   Grid: ${gridSettings.desktopUnits}x (desktop), ${gridSettings.tabletUnits}x (tablet), ${gridSettings.mobileUnits}x (mobile)\n`);

    // Step 3: Find WUKF template
    console.log('🔍 Searching for WUKF template...');
    const wukfTemplate = await db.collection('report_templates').findOne({
      name: { $regex: /wukf/i }
    });

    if (!wukfTemplate) {
      console.log('❌ WUKF template not found!');
      console.log('   Looking for templates with "wukf" in name...\n');
      
      const allTemplates = await db.collection('report_templates').find({}).toArray();
      console.log('   Available templates:');
      allTemplates.forEach(t => {
        console.log(`   - ${t.name} (${t.type}${t.isDefault ? ', DEFAULT' : ''})`);
      });
      
      console.log('\n❌ Migration failed: WUKF template not found');
      return;
    }

    console.log(`   ✅ Found: ${wukfTemplate.name} (${wukfTemplate._id})\n`);

    // Step 4: Build dataBlocks references array
    console.log('🔗 Creating dataBlocks references...');
    const dataBlockReferences = dataBlocks
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((block, index) => ({
        blockId: block._id.toString(),
        order: block.order !== undefined ? block.order : index
      }));

    console.log(`   Created ${dataBlockReferences.length} block references\n`);

    // Step 5: Update WUKF template
    console.log('💾 Updating WUKF template...');
    const updateResult = await db.collection('report_templates').updateOne(
      { _id: wukfTemplate._id },
      {
        $set: {
          dataBlocks: dataBlockReferences,
          gridSettings: gridSettings,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('   ✅ WUKF template updated successfully!\n');
    } else {
      console.log('   ⚠️  No changes made (template already up to date)\n');
    }

    // Step 6: Verification
    console.log('🔍 Verification...');
    const updatedTemplate = await db.collection('report_templates').findOne({ _id: wukfTemplate._id });
    console.log(`   Template name: ${updatedTemplate?.name}`);
    console.log(`   Data blocks: ${updatedTemplate?.dataBlocks?.length || 0}`);
    console.log(`   Grid settings: ${updatedTemplate?.gridSettings?.desktopUnits}x desktop`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Migrated ${dataBlockReferences.length} data blocks to WUKF template`);
    console.log(`   - Set grid settings: ${gridSettings.desktopUnits}x/${gridSettings.tabletUnits}x/${gridSettings.mobileUnits}x`);
    console.log(`   - WUKF template ID: ${wukfTemplate._id}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateGlobalVisualizationToWUKF()
  .then(() => {
    console.log('\n🎉 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
