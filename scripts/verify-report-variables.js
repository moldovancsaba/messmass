#!/usr/bin/env node

/**
 * Verify Report Variables
 * 
 * Check if reportImage and reportText variables are properly configured
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'messmass';

async function verifyReportVariables() {
  console.log('🔍 Verifying Report Variables\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const variablesCollection = db.collection('variables_metadata');
    
    // Check reportImage variables (MongoDB Atlas format with stats. prefix)
    const imageVars = await variablesCollection.find({
      name: { $regex: /^stats\.reportImage\d+$/ }
    }).sort({ name: 1 }).toArray();
    
    console.log(`📸 Found ${imageVars.length} stats.reportImage variables:`);
    imageVars.slice(0, 5).forEach(v => {
      console.log(`   ✅ ${v.name} - ${v.label} (${v.category})`);
    });
    if (imageVars.length > 5) {
      console.log(`   ... and ${imageVars.length - 5} more`);
    }
    
    // Check reportText variables (MongoDB Atlas format with stats. prefix)
    const textVars = await variablesCollection.find({
      name: { $regex: /^stats\.reportText\d+$/ }
    }).sort({ name: 1 }).toArray();
    
    console.log(`\n📝 Found ${textVars.length} stats.reportText variables:`);
    textVars.slice(0, 5).forEach(v => {
      console.log(`   ✅ ${v.name} - ${v.label} (${v.category})`);
    });
    if (textVars.length > 5) {
      console.log(`   ... and ${textVars.length - 5} more`);
    }
    
    // Check if variables have proper structure
    const sampleVar = imageVars[0];
    if (sampleVar) {
      console.log('\n🔧 Sample variable structure:');
      console.log(`   Name: ${sampleVar.name}`);
      console.log(`   Label: ${sampleVar.label}`);
      console.log(`   Type: ${sampleVar.type}`);
      console.log(`   Category: ${sampleVar.category}`);
      console.log(`   Flags: ${JSON.stringify(sampleVar.flags)}`);
    }
    
    console.log('\n🎯 VERIFICATION RESULT:');
    if (imageVars.length > 0 && textVars.length > 0) {
      console.log('✅ Report variables are properly configured');
      console.log('✅ Variables should now appear in Chart Configuration editor');
      console.log('✅ Formula field should accept [stats.reportImage1] syntax');
    } else {
      console.log('❌ Report variables are missing');
      console.log('❌ Run: node scripts/add-report-image-variables.js');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await client.close();
  }
}

// Run the verification
verifyReportVariables();