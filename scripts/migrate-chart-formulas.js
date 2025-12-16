#!/usr/bin/env node

/**
 * WHAT: Migration script to update chart formulas from stats.report* to report* format
 * WHY: User wants simple format (reportImage2) instead of old format (stats.reportImage2)
 * HOW: Find all chart configurations with stats.report* formulas and update them
 */

const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrateChartFormulas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    console.log('🔍 Finding chart configurations with stats.report* formulas...');
    
    // Find all configurations that have elements with formulas containing stats.report
    const configurations = await collection.find({
      'elements.formula': { $regex: /stats\.report/ }
    }).toArray();
    
    console.log(`📊 Found ${configurations.length} chart configurations to migrate`);
    
    if (configurations.length === 0) {
      console.log('✅ No configurations need migration');
      return;
    }
    
    let updatedCount = 0;
    
    for (const config of configurations) {
      console.log(`\n🔄 Processing: ${config.title} (${config.chartId})`);
      
      let hasChanges = false;
      const updatedElements = config.elements.map((element, index) => {
        if (element.formula && element.formula.includes('stats.report')) {
          console.log(`  📝 Element ${index + 1}: "${element.formula}"`);
          
          // Replace stats.reportImage* with reportImage*
          let newFormula = element.formula.replace(/stats\.reportImage(\d+)/g, 'reportImage$1');
          
          // Replace stats.reportText* with reportText*
          newFormula = newFormula.replace(/stats\.reportText(\d+)/g, 'reportText$1');
          
          if (newFormula !== element.formula) {
            console.log(`  ✅ Updated to: "${newFormula}"`);
            hasChanges = true;
            return { ...element, formula: newFormula };
          }
        }
        return element;
      });
      
      if (hasChanges) {
        // Update the configuration in the database
        const result = await collection.updateOne(
          { _id: config._id },
          { 
            $set: { 
              elements: updatedElements,
              updatedAt: new Date().toISOString(),
              lastModifiedBy: 'migration-script'
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`  ✅ Successfully updated configuration`);
        } else {
          console.log(`  ⚠️  Failed to update configuration`);
        }
      } else {
        console.log(`  ℹ️  No changes needed`);
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`📊 Total configurations processed: ${configurations.length}`);
    console.log(`✅ Configurations updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔗 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateChartFormulas().catch(console.error);
}

module.exports = { migrateChartFormulas };