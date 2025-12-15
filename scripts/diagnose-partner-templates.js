#!/usr/bin/env node

// scripts/diagnose-partner-templates.js
// WHAT: Diagnose partner report template system
// WHY: Partner reports aren't showing charts - check template resolution
// HOW: Check templates, partners, and template resolution logic

const { MongoClient, ObjectId } = require('mongodb');

// Load configuration
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function diagnosePartnerTemplates() {
  console.log('🔍 Diagnosing partner report template system...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // 1. Check report templates
    console.log('\n📋 Report Templates:');
    const templates = await db.collection('report_templates').find({}).toArray();
    console.log(`Found ${templates.length} templates`);
    
    for (const template of templates) {
      console.log(`\n  📄 ${template.name} (${template.type})`);
      console.log(`     ID: ${template._id}`);
      console.log(`     Default: ${template.isDefault}`);
      console.log(`     Blocks: ${template.dataBlocks?.length || 0}`);
      
      if (template.dataBlocks && template.dataBlocks.length > 0) {
        console.log(`     Block IDs: ${template.dataBlocks.map(b => b.blockId).join(', ')}`);
      }
    }
    
    // 2. Check partners with templates
    console.log('\n👥 Partners with Templates:');
    const partnersWithTemplates = await db.collection('partners').find({ reportTemplateId: { $exists: true } }).toArray();
    console.log(`Found ${partnersWithTemplates.length} partners with templates`);
    
    for (const partner of partnersWithTemplates) {
      console.log(`\n  🤝 ${partner.name}`);
      console.log(`     ID: ${partner._id}`);
      console.log(`     Template ID: ${partner.reportTemplateId}`);
      console.log(`     View Slug: ${partner.viewSlug || 'None'}`);
      
      // Check if template exists
      const template = await db.collection('report_templates').findOne({ _id: partner.reportTemplateId });
      if (template) {
        console.log(`     ✅ Template found: ${template.name}`);
      } else {
        console.log(`     ❌ Template not found!`);
      }
    }
    
    // 3. Check default templates
    console.log('\n🎯 Default Templates:');
    const defaultTemplates = await db.collection('report_templates').find({ isDefault: true }).toArray();
    console.log(`Found ${defaultTemplates.length} default templates`);
    
    for (const template of defaultTemplates) {
      console.log(`\n  📄 ${template.name} (${template.type})`);
      console.log(`     Blocks: ${template.dataBlocks?.length || 0}`);
    }
    
    // 4. Check data blocks
    console.log('\n📦 Data Blocks:');
    const blocks = await db.collection('data_blocks').find({}).toArray();
    console.log(`Found ${blocks.length} data blocks`);
    
    const blocksByType = {};
    for (const block of blocks) {
      if (!blocksByType[block.type]) {
        blocksByType[block.type] = 0;
      }
      blocksByType[block.type]++;
    }
    
    console.log('Block types:', blocksByType);
    
    // 5. Test template resolution for a sample partner
    console.log('\n🧪 Testing Template Resolution:');
    const samplePartner = await db.collection('partners').findOne({ viewSlug: { $exists: true } });
    
    if (samplePartner) {
      console.log(`\nTesting with partner: ${samplePartner.name}`);
      console.log(`View slug: ${samplePartner.viewSlug}`);
      
      // Simulate template resolution logic
      let resolvedTemplate = null;
      let resolvedFrom = 'none';
      
      if (samplePartner.reportTemplateId) {
        resolvedTemplate = await db.collection('report_templates').findOne({ _id: samplePartner.reportTemplateId });
        if (resolvedTemplate) {
          resolvedFrom = 'partner';
        }
      }
      
      if (!resolvedTemplate) {
        resolvedTemplate = await db.collection('report_templates').findOne({ type: 'partner', isDefault: true });
        if (resolvedTemplate) {
          resolvedFrom = 'default';
        }
      }
      
      if (resolvedTemplate) {
        console.log(`✅ Template resolved from: ${resolvedFrom}`);
        console.log(`   Template: ${resolvedTemplate.name}`);
        console.log(`   Blocks: ${resolvedTemplate.dataBlocks?.length || 0}`);
      } else {
        console.log(`❌ No template could be resolved!`);
      }
    } else {
      console.log('No partners with view slugs found');
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing partner templates:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the diagnosis
diagnosePartnerTemplates().catch(console.error);