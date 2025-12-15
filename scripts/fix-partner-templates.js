#!/usr/bin/env node

// scripts/fix-partner-templates.js
// WHAT: Fix partner template system issues
// WHY: Partner reports aren't showing charts due to template resolution problems
// HOW: Set default partner template and fix null template references

const { MongoClient, ObjectId } = require('mongodb');

// Load configuration
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixPartnerTemplates() {
  console.log('🔧 Fixing partner template system...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // 1. Set "Default Partner Report" as the default partner template
    console.log('\n📋 Setting default partner template...');
    const defaultPartnerResult = await db.collection('report_templates').updateOne(
      { name: 'Default Partner Report', type: 'partner' },
      { $set: { isDefault: true } }
    );
    
    if (defaultPartnerResult.modifiedCount > 0) {
      console.log('✅ Set "Default Partner Report" as default partner template');
    } else {
      console.log('⚠️  Could not find "Default Partner Report" template');
    }
    
    // 2. Fix partners with null template IDs
    console.log('\n👥 Fixing partners with null template IDs...');
    const partnersWithNullTemplates = await db.collection('partners').find({ 
      reportTemplateId: null 
    }).toArray();
    
    console.log(`Found ${partnersWithNullTemplates.length} partners with null template IDs`);
    
    for (const partner of partnersWithNullTemplates) {
      console.log(`🔧 Removing null template ID from ${partner.name}`);
      await db.collection('partners').updateOne(
        { _id: partner._id },
        { $unset: { reportTemplateId: "" } }
      );
    }
    
    // 3. Verify template resolution now works
    console.log('\n🧪 Testing template resolution after fixes...');
    const samplePartner = await db.collection('partners').findOne({ viewSlug: { $exists: true } });
    
    if (samplePartner) {
      console.log(`Testing with partner: ${samplePartner.name}`);
      
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
        console.log(`❌ Template resolution still failing!`);
      }
    }
    
    console.log('\n✅ Partner template system fixes completed');
    
  } catch (error) {
    console.error('❌ Error fixing partner templates:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixPartnerTemplates().catch(console.error);