#!/usr/bin/env node

/**
 * Migrate HERO Settings for Existing Templates
 * 
 * WHAT: Add default HERO block visibility settings to existing chart configurations
 * WHY: Ensure backward compatibility - all existing templates show all HERO elements by default
 * HOW: Update all chart configurations without heroSettings to include default values
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'messmass';

async function migrateHeroSettings() {
  console.log('🔄 Migrating HERO Settings for Existing Templates\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('chart_configurations');
    
    // Check how many templates need migration
    const templatesWithoutHero = await collection.countDocuments({
      heroSettings: { $exists: false }
    });
    
    const templatesWithoutAlignment = await collection.countDocuments({
      alignmentSettings: { $exists: false }
    });
    
    console.log(`📊 Found ${templatesWithoutHero} templates without HERO settings`);
    console.log(`📊 Found ${templatesWithoutAlignment} templates without alignment settings`);
    
    if (templatesWithoutHero === 0 && templatesWithoutAlignment === 0) {
      console.log('✅ All templates already have HERO and alignment settings');
      return;
    }
    
    console.log('\n🔧 Adding default settings to existing templates...');
    
    const now = new Date().toISOString();
    
    // WHAT: Default HERO settings - show all elements (backward compatibility)
    // WHY: Existing reports should continue to look the same after migration
    const defaultHeroSettings = {
      showEmoji: true,
      showDateInfo: true,
      showExportOptions: true
    };
    
    // WHAT: Default alignment settings - enable all alignment features
    // WHY: Improve visual consistency for existing templates
    const defaultAlignmentSettings = {
      alignTitles: true,
      alignDescriptions: true,
      alignCharts: true
    };
    
    // Update templates without HERO settings
    if (templatesWithoutHero > 0) {
      const heroResult = await collection.updateMany(
        { heroSettings: { $exists: false } },
        { 
          $set: { 
            heroSettings: defaultHeroSettings,
            updatedAt: now
          }
        }
      );
      
      console.log(`✅ Added HERO settings to ${heroResult.modifiedCount} templates`);
    }
    
    // Update templates without alignment settings
    if (templatesWithoutAlignment > 0) {
      const alignmentResult = await collection.updateMany(
        { alignmentSettings: { $exists: false } },
        { 
          $set: { 
            alignmentSettings: defaultAlignmentSettings,
            updatedAt: now
          }
        }
      );
      
      console.log(`✅ Added alignment settings to ${alignmentResult.modifiedCount} templates`);
    }
    
    // Verify migration
    const finalCount = await collection.countDocuments({
      $or: [
        { heroSettings: { $exists: false } },
        { alignmentSettings: { $exists: false } }
      ]
    });
    
    console.log('\n🎯 MIGRATION RESULT:');
    if (finalCount === 0) {
      console.log('✅ All templates now have HERO and alignment settings');
      console.log('✅ Existing reports will continue to show all HERO elements');
      console.log('✅ New templates can customize HERO visibility as needed');
    } else {
      console.log(`❌ ${finalCount} templates still missing settings`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration
migrateHeroSettings();