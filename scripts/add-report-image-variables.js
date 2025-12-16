#!/usr/bin/env node

/**
 * Add Report Image Variables to KYC
 * 
 * WHAT: Add reportImage1-500 variables to variables_metadata collection
 * WHY: Chart configurator needs these variables in the dropdown
 * HOW: Insert variables with proper metadata structure
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'messmass';

async function addReportImageVariables() {
  console.log('🔧 Adding Report Image Variables to KYC\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const variablesCollection = db.collection('variables_metadata');
    
    // Check if stats.reportImage1 already exists
    const existing = await variablesCollection.findOne({ name: 'stats.reportImage1' });
    if (existing) {
      console.log('✅ Report image variables already exist');
      return;
    }
    
    console.log('📝 Creating report image variables...');
    
    const variables = [];
    const now = new Date().toISOString();
    
    // Create reportImage1-20 variables with stats. prefix (MongoDB Atlas format)
    for (let i = 1; i <= 20; i++) {
      variables.push({
        name: `stats.reportImage${i}`,
        label: `Report Image ${i}`,
        type: 'text', // URL is stored as text
        category: 'Report Content',
        description: `Event-specific report image ${i} URL`,
        unit: null,
        derived: false,
        formula: null,
        flags: {
          visibleInClicker: true,
          editableInManual: true
        },
        isSystem: false,
        order: 1000 + i, // High order to appear at end
        createdAt: now,
        updatedAt: now,
        createdBy: 'system-script'
      });
    }
    
    // Create reportText1-20 variables with stats. prefix (MongoDB Atlas format)
    for (let i = 1; i <= 20; i++) {
      variables.push({
        name: `stats.reportText${i}`,
        label: `Report Text ${i}`,
        type: 'text',
        category: 'Report Content',
        description: `Event-specific report text ${i}`,
        unit: null,
        derived: false,
        formula: null,
        flags: {
          visibleInClicker: true,
          editableInManual: true
        },
        isSystem: false,
        order: 2000 + i, // High order to appear at end
        createdAt: now,
        updatedAt: now,
        createdBy: 'system-script'
      });
    }
    
    // Insert all variables
    const result = await variablesCollection.insertMany(variables);
    
    console.log(`✅ Added ${result.insertedCount} report content variables`);
    console.log('   - reportImage1-20');
    console.log('   - reportText1-20');
    
    console.log('\n🔄 Invalidating variables cache...');
    
    // Invalidate cache by calling the API
    try {
      const response = await fetch('http://localhost:3001/api/variables-config?action=invalidateCache', {
        method: 'PUT'
      });
      if (response.ok) {
        console.log('✅ Variables cache invalidated');
      } else {
        console.log('⚠️ Could not invalidate cache (server may not be running)');
      }
    } catch (error) {
      console.log('⚠️ Could not invalidate cache:', error.message);
    }
    
    console.log('\n🎯 RESULT:');
    console.log('Report image and text variables are now available in:');
    console.log('- Chart Configuration editor dropdown');
    console.log('- Formula input field');
    console.log('- Variable picker');
    
  } catch (error) {
    console.error('❌ Failed to add report image variables:', error);
  } finally {
    await client.close();
  }
}

// Run the script
addReportImageVariables();