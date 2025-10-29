/**
 * Add Missing Visitor KYC Variables
 * 
 * WHY: The "Visitor Sources" chart references stats.visitQrCode, stats.visitShortUrl, 
 * and stats.visitWeb, but these variables are not registered in the KYC system.
 * 
 * WHAT: Registers the 3 missing visitor variables with proper metadata in variables_metadata collection.
 * 
 * WHEN: Run once to fix missing KYC variables for visitor source tracking.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addVisitorKYCVariables() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('messmass');
    const collection = db.collection('variables_metadata');
    
    // Define the 3 missing visitor variables
    const visitorVariables = [
      {
        name: 'stats.visitQrCode',
        label: 'QR Code Visits',
        type: 'number',
        category: 'visits',
        visibleInClicker: false, // Not a clicker button, populated by API
        editableInManual: true,  // Can be manually edited in Editor
        isBaseVariable: true,
        isDerived: false,
        description: 'Number of visitors who scanned QR code to access event page',
        order: 100 // After other visit variables
      },
      {
        name: 'stats.visitShortUrl',
        label: 'Short URL Visits',
        type: 'number',
        category: 'visits',
        visibleInClicker: false, // Not a clicker button, populated by Bitly API
        editableInManual: true,
        isBaseVariable: true,
        isDerived: false,
        description: 'Number of visitors who clicked Bitly short URL',
        order: 101
      },
      {
        name: 'stats.visitWeb',
        label: 'Direct Web Visits',
        type: 'number',
        category: 'visits',
        visibleInClicker: false, // Not a clicker button, direct web access
        editableInManual: true,
        isBaseVariable: true,
        isDerived: false,
        description: 'Number of visitors who accessed event page directly via web URL',
        order: 102
      }
    ];
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const variable of visitorVariables) {
      // Check if variable already exists
      const existing = await collection.findOne({ name: variable.name });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${variable.name} (already exists)`);
        skippedCount++;
        continue;
      }
      
      // Add timestamps
      const now = new Date().toISOString();
      variable.createdAt = now;
      variable.updatedAt = now;
      
      // Insert variable
      await collection.insertOne(variable);
      console.log(`✅ Added: ${variable.name} - "${variable.label}"`);
      addedCount++;
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Added: ${addedCount} variables`);
    console.log(`   Skipped: ${skippedCount} variables (already exist)`);
    
    // Verify all visitor variables now exist
    console.log('\n🔍 Verification:');
    const allVisitorVars = [
      'stats.visitQrCode',
      'stats.visitShortUrl',
      'stats.visitWeb'
    ];
    
    for (const varName of allVisitorVars) {
      const exists = await collection.findOne({ name: varName });
      console.log(`   ${exists ? '✅' : '❌'} ${varName}`);
    }
    
    console.log('\n✨ Visitor KYC variables registration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Execute if run directly
if (require.main === module) {
  addVisitorKYCVariables();
}

module.exports = { addVisitorKYCVariables };
