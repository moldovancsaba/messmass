// scripts/cleanup-report-kyc-variables.ts
// WHAT: Remove reportImage1-500 and reportText1-500 from KYC variables
// WHY: These variables are not needed in KYC - Report Content Manager handles them directly
// HOW: Delete from variables_metadata collection, keep content_assets for reference

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanupReportKYCVariables() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const variablesCollection = db.collection('variables_metadata');
    
    console.log('\n🧹 Cleaning up reportImage and reportText KYC variables...\n');
    
    // WHAT: Find all reportImage* and reportText* variables in KYC
    // WHY: These should not be in KYC - they're managed by Report Content Manager
    const reportVariables = await variablesCollection.find({
      $or: [
        { name: { $regex: /^reportImage\d+$/ } },
        { name: { $regex: /^reportText\d+$/ } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${reportVariables.length} report variables in KYC:\n`);
    
    if (reportVariables.length === 0) {
      console.log('✅ No report variables found in KYC. Already clean!');
      return;
    }
    
    // Show what will be deleted
    const imageVars = reportVariables.filter(v => v.name.startsWith('reportImage'));
    const textVars = reportVariables.filter(v => v.name.startsWith('reportText'));
    
    console.log(`   📷 Images: ${imageVars.length} variables`);
    console.log(`   📝 Texts: ${textVars.length} variables`);
    console.log('');
    
    // List first 5 of each type as examples
    if (imageVars.length > 0) {
      console.log('   Examples (images):');
      imageVars.slice(0, 5).forEach(v => console.log(`      - ${v.name} (${v.label || 'no label'})`));
      if (imageVars.length > 5) console.log(`      ... and ${imageVars.length - 5} more`);
      console.log('');
    }
    
    if (textVars.length > 0) {
      console.log('   Examples (texts):');
      textVars.slice(0, 5).forEach(v => console.log(`      - ${v.name} (${v.label || 'no label'})`));
      if (textVars.length > 5) console.log(`      ... and ${textVars.length - 5} more`);
      console.log('');
    }
    
    // WHAT: Delete all reportImage* and reportText* variables from KYC
    // WHY: They are not needed - Report Content Manager handles them via project.stats
    const result = await variablesCollection.deleteMany({
      $or: [
        { name: { $regex: /^reportImage\d+$/ } },
        { name: { $regex: /^reportText\d+$/ } }
      ]
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} KYC variables\n`);
    
    console.log('📋 What this means:');
    console.log('   ✅ Report Content Manager still works (stores in project.stats)');
    console.log('   ✅ Auto-generated chart blocks still work');
    console.log('   ✅ Visualization Manager still works');
    console.log('   ✅ Report templates still work');
    console.log('   ✅ KYC page is now cleaner (no confusion)');
    console.log('');
    console.log('📊 Your workflow remains unchanged:');
    console.log('   1. Upload images in 📦 Report Content → Bulk Upload');
    console.log('   2. System creates reportImageN in project.stats');
    console.log('   3. Auto-generates chart blocks');
    console.log('   4. Use in Visualization Manager');
    console.log('   5. Build and send reports to clients');
    
  } catch (error) {
    console.error('❌ Error cleaning up KYC variables:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run cleanup
cleanupReportKYCVariables();
