// scripts/add-partner-report-variables.js
// WHAT: Add 20 partner report variables (10 text + 10 image) to variables_metadata
// WHY: Enable customizable event reports with text notes and uploaded images
// HOW: Insert reportText1-10 (textarea) and reportImage1-10 (image URL) variables

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function addPartnerReportVariables() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const variablesCollection = db.collection('variables_metadata');
    
    const now = new Date().toISOString();
    
    console.log('\n📊 Adding Partner Report variables...\n');
    
    // ==========================================
    // STEP 1: Add 10 text fields
    // ==========================================
    console.log('📝 Adding text fields (reportText1-10)...');
    
    const textVariables = [];
    for (let i = 1; i <= 10; i++) {
      textVariables.push({
        name: `stats.reportText${i}`,
        label: `reportText${i}`, // User will customize in admin
        type: 'text',
        category: 'Partner Report',
        description: `Customizable text field ${i} for partner reports`,
        derived: false,
        flags: {
          visibleInClicker: true,
          editableInManual: true
        },
        isSystem: false,
        order: 300 + i,
        createdAt: now,
        updatedAt: now
      });
    }
    
    let textCreated = 0;
    let textUpdated = 0;
    
    for (const textVar of textVariables) {
      const result = await variablesCollection.updateOne(
        { name: textVar.name },
        { $set: textVar },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`  ✅ Created: ${textVar.name}`);
        textCreated++;
      } else {
        console.log(`  ℹ️  Updated: ${textVar.name}`);
        textUpdated++;
      }
    }
    
    console.log(`\n📈 Text fields: ${textCreated} created, ${textUpdated} updated`);
    
    // ==========================================
    // STEP 2: Add 10 image fields
    // ==========================================
    console.log('\n🖼️  Adding image fields (reportImage1-10)...');
    
    const imageVariables = [];
    for (let i = 1; i <= 10; i++) {
      imageVariables.push({
        name: `stats.reportImage${i}`,
        label: `reportImage${i}`, // User will customize in admin
        type: 'text', // Stores URL as text
        category: 'Partner Report',
        description: `Customizable image field ${i} for partner reports (ImgBB URL)`,
        derived: false,
        flags: {
          visibleInClicker: true,
          editableInManual: true
        },
        isSystem: false,
        order: 400 + i,
        createdAt: now,
        updatedAt: now
      });
    }
    
    let imageCreated = 0;
    let imageUpdated = 0;
    
    for (const imageVar of imageVariables) {
      const result = await variablesCollection.updateOne(
        { name: imageVar.name },
        { $set: imageVar },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`  ✅ Created: ${imageVar.name}`);
        imageCreated++;
      } else {
        console.log(`  ℹ️  Updated: ${imageVar.name}`);
        imageUpdated++;
      }
    }
    
    console.log(`\n📈 Image fields: ${imageCreated} created, ${imageUpdated} updated`);
    
    // ==========================================
    // Summary
    // ==========================================
    console.log('\n✅ Partner Report Variables Summary:');
    console.log(`   Text fields:  ${textCreated + textUpdated} total (${textCreated} new)`);
    console.log(`   Image fields: ${imageCreated + imageUpdated} total (${imageCreated} new)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Customize labels in /admin/kyc');
    console.log('   2. Create variable groups in /admin/clicker-manager');
    console.log('   3. Add to editor layout for data entry');
    console.log('   4. Create image/text charts in /admin/charts');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addPartnerReportVariables();
