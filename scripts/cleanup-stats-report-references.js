#!/usr/bin/env node

/**
 * WHAT: Clean up all remaining stats.report* references in chart configurations
 * WHY: Remove all legacy stats.report* format from titles, chartIds, and labels
 * HOW: Find and update all fields that contain stats.report* patterns
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

async function cleanupStatsReportReferences() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    console.log('🔍 Finding chart configurations with stats.report* references...');
    
    // Find all configurations that have stats.report references anywhere
    const configurations = await collection.find({
      $or: [
        { title: { $regex: /stats\.report/ } },
        { chartId: { $regex: /stats\.report/ } },
        { 'elements.label': { $regex: /stats\.report/ } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${configurations.length} chart configurations to clean up`);
    
    if (configurations.length === 0) {
      console.log('✅ No configurations need cleanup');
      return;
    }
    
    let updatedCount = 0;
    
    for (const config of configurations) {
      console.log(`\n🔄 Processing: ${config.title} (${config.chartId})`);
      
      let hasChanges = false;
      const updates = {};
      
      // Clean up title
      if (config.title && config.title.includes('stats.report')) {
        const newTitle = config.title
          .replace(/\[stats\.reportImage(\d+)\]/g, 'Report Image $1')
          .replace(/\[stats\.reportText(\d+)\]/g, 'Report Text $1')
          .replace(/stats\.reportImage(\d+)/g, 'Report Image $1')
          .replace(/stats\.reportText(\d+)/g, 'Report Text $1');
        
        if (newTitle !== config.title) {
          updates.title = newTitle;
          hasChanges = true;
          console.log(`  📝 Title: "${config.title}" → "${newTitle}"`);
        }
      }
      
      // Clean up chartId
      if (config.chartId && config.chartId.includes('stats.report')) {
        const newChartId = config.chartId
          .replace(/stats\.reportImage(\d+)/g, 'report-image-$1')
          .replace(/stats\.reportText(\d+)/g, 'report-text-$1');
        
        if (newChartId !== config.chartId) {
          updates.chartId = newChartId;
          hasChanges = true;
          console.log(`  🆔 ChartId: "${config.chartId}" → "${newChartId}"`);
        }
      }
      
      // Clean up element labels
      if (config.elements && config.elements.length > 0) {
        const updatedElements = config.elements.map((element, index) => {
          if (element.label && element.label.includes('stats.report')) {
            const newLabel = element.label
              .replace(/\[stats\.reportImage(\d+)\]/g, 'Report Image $1')
              .replace(/\[stats\.reportText(\d+)\]/g, 'Report Text $1')
              .replace(/stats\.reportImage(\d+)/g, 'Report Image $1')
              .replace(/stats\.reportText(\d+)/g, 'Report Text $1');
            
            if (newLabel !== element.label) {
              console.log(`  🏷️  Element ${index + 1} label: "${element.label}" → "${newLabel}"`);
              return { ...element, label: newLabel };
            }
          }
          return element;
        });
        
        // Check if any elements were changed
        const elementsChanged = updatedElements.some((el, idx) => 
          el.label !== config.elements[idx].label
        );
        
        if (elementsChanged) {
          updates.elements = updatedElements;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // Update the configuration in the database
        const result = await collection.updateOne(
          { _id: config._id },
          { 
            $set: { 
              ...updates,
              updatedAt: new Date().toISOString(),
              lastModifiedBy: 'cleanup-script'
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
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`📊 Total configurations processed: ${configurations.length}`);
    console.log(`✅ Configurations updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔗 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupStatsReportReferences().catch(console.error);
}

module.exports = { cleanupStatsReportReferences };