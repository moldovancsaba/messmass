#!/usr/bin/env ts-node

// WHAT: Migration script for Report Template System (v11.0.0)
// WHY: Preserve WUKF configuration and establish default templates
// HOW: Snapshot current data_blocks, create templates, link to partners

import { MongoClient, ObjectId } from 'mongodb';
import { ReportTemplate, DEFAULT_GRID_SETTINGS } from '../lib/reportTemplateTypes';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface DataBlock {
  _id: ObjectId;
  name: string;
  charts: any[];
  order: number;
  isActive: boolean;
  showTitle?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GridSettings {
  desktopUnits: number;
  tabletUnits: number;
  mobileUnits: number;
}

async function migrateToReportTemplates() {
  console.log('🚀 Starting Report Template System Migration (v11.0.0)');
  console.log('━'.repeat(60));
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const templatesCollection = db.collection('report_templates');
    const dataBlocksCollection = db.collection('data_blocks');
    const partnersCollection = db.collection('partners');
    const gridSettingsCollection = db.collection('grid_settings');
    
    // Check if migration already ran
    const existingTemplates = await templatesCollection.countDocuments();
    if (existingTemplates > 0) {
      console.log(`⚠️  Found ${existingTemplates} existing templates. Migration may have already run.`);
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('Use --force flag to re-run migration');
        process.exit(0);
      }
      console.log('🔄 Force flag detected, proceeding with migration');
    }

    console.log('\n📊 Step 1: Create indexes for report_templates collection');
    await templatesCollection.createIndex({ isDefault: 1 });
    await templatesCollection.createIndex({ type: 1 });
    await templatesCollection.createIndex({ name: 1 });
    console.log('✅ Indexes created');

    // ==========================================
    // STEP 2: Snapshot current configuration
    // ==========================================
    console.log('\n📸 Step 2: Snapshot current configuration');
    
    const activeBlocks = await dataBlocksCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray() as unknown as DataBlock[];
    
    console.log(`   Found ${activeBlocks.length} active data blocks`);
    
    // Get grid settings
    const gridSettingsDoc = await gridSettingsCollection.findOne({});
    const gridSettings: GridSettings = gridSettingsDoc ? {
      desktopUnits: gridSettingsDoc.desktopUnits || DEFAULT_GRID_SETTINGS.desktopUnits,
      tabletUnits: gridSettingsDoc.tabletUnits || DEFAULT_GRID_SETTINGS.tabletUnits,
      mobileUnits: gridSettingsDoc.mobileUnits || DEFAULT_GRID_SETTINGS.mobileUnits
    } : DEFAULT_GRID_SETTINGS;
    console.log(`   Grid settings: ${gridSettings.desktopUnits}/${gridSettings.tabletUnits}/${gridSettings.mobileUnits}`);

    // Create block references for templates
    const dataBlockReferences = activeBlocks.map((block, index) => ({
      blockId: block._id,
      order: index
    }));

    // ==========================================
    // STEP 3: Create WUKF Template
    // ==========================================
    console.log('\n🏆 Step 3: Create WUKF Template');
    
    // Find WUKF partner
    const wukfPartner = await partnersCollection.findOne({
      name: { $regex: /wukf/i }
    });

    if (wukfPartner) {
      console.log(`   Found WUKF partner: ${wukfPartner.name} (${wukfPartner._id})`);
      
      const wukfTemplate: Omit<ReportTemplate, '_id'> = {
        name: 'WUKF Template',
        description: 'Original WUKF report configuration (preserved during v11.0.0 migration)',
        type: 'partner',
        isDefault: false,
        dataBlocks: dataBlockReferences,
        gridSettings: gridSettings,
        createdBy: 'migration_script',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const wukfResult = await templatesCollection.insertOne(wukfTemplate as any);
      console.log(`   ✅ WUKF template created: ${wukfResult.insertedId}`);

      // Link WUKF partner to template
      await partnersCollection.updateOne(
        { _id: wukfPartner._id },
        { $set: { reportTemplateId: wukfResult.insertedId } }
      );
      console.log(`   ✅ WUKF partner linked to template`);
    } else {
      console.log('   ⚠️  WUKF partner not found, skipping WUKF template creation');
    }

    // ==========================================
    // STEP 4: Create Default Event Template
    // ==========================================
    console.log('\n📊 Step 4: Create Default Event Template');
    
    const defaultEventTemplate: Omit<ReportTemplate, '_id'> = {
      name: 'Default Event Report',
      description: 'Default template for event reports (all active blocks)',
      type: 'event',
      isDefault: true,
      dataBlocks: dataBlockReferences,
      gridSettings: gridSettings,
      createdBy: 'migration_script',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const eventResult = await templatesCollection.insertOne(defaultEventTemplate as any);
    console.log(`   ✅ Default event template created: ${eventResult.insertedId}`);

    // ==========================================
    // STEP 5: Create Default Partner Template
    // ==========================================
    console.log('\n🤝 Step 5: Create Default Partner Template');
    
    const defaultPartnerTemplate: Omit<ReportTemplate, '_id'> = {
      name: 'Default Partner Report',
      description: 'Default template for partner reports (aggregate visualizations)',
      type: 'partner',
      isDefault: false,
      dataBlocks: dataBlockReferences, // Same blocks for now, can be customized later
      gridSettings: gridSettings,
      createdBy: 'migration_script',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const partnerResult = await templatesCollection.insertOne(defaultPartnerTemplate as any);
    console.log(`   ✅ Default partner template created: ${partnerResult.insertedId}`);

    // ==========================================
    // STEP 6: Summary and Validation
    // ==========================================
    console.log('\n✅ Migration Summary');
    console.log('━'.repeat(60));
    
    const finalTemplateCount = await templatesCollection.countDocuments();
    const templates = await templatesCollection.find({}).toArray();
    
    console.log(`Total templates created: ${finalTemplateCount}`);
    templates.forEach((template: any) => {
      console.log(`  • ${template.name} [${template.type}] ${template.isDefault ? '⭐ DEFAULT' : ''}`);
      console.log(`    Blocks: ${template.dataBlocks.length}, Grid: ${template.gridSettings.desktopUnits}/${template.gridSettings.tabletUnits}/${template.gridSettings.mobileUnits}`);
    });

    console.log('\n🔍 Validation Checks');
    
    // Check default template exists
    const defaultTemplate = await templatesCollection.findOne({ isDefault: true });
    if (defaultTemplate) {
      console.log('  ✅ Default template exists');
    } else {
      console.log('  ❌ No default template found!');
    }

    // Check WUKF partner linkage
    if (wukfPartner) {
      const updatedWukf = await partnersCollection.findOne({ _id: wukfPartner._id });
      if (updatedWukf?.reportTemplateId) {
        console.log('  ✅ WUKF partner linked to template');
      } else {
        console.log('  ❌ WUKF partner not linked!');
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Test WUKF reports: /partner-report/{wukf-slug}');
    console.log('  2. Test event reports with default template');
    console.log('  3. Deploy API endpoints for template management');
    console.log('  4. Update frontend pages to use /api/report-config');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run migration
migrateToReportTemplates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
