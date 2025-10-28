#!/usr/bin/env node

/**
 * SINGLE REFERENCE SYSTEM - Chart Formula Migration Script
 * 
 * WHAT: Updates chart formulas from old tokens to new single reference tokens
 * WHY: Eliminate SEYU prefixes and complex mappings - use database field names directly
 * HOW: Replace [SEYU...] tokens with [fieldName] tokens
 * 
 * SAFE: Runs in dry-run mode by default, use --live to apply changes
 * 
 * OLD: [SEYUREMOTFANS], [SEYUSTADIUMFANS], [SEYUTOTALIMAGES]
 * NEW: [remoteFans], [stadium], [allImages]
 * 
 * Usage:
 *   npm run migrate:chart-formulas          # Dry run
 *   npm run migrate:chart-formulas -- --live  # Apply changes
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables from .env.local (Next.js convention)
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Check command line arguments
const args = process.argv.slice(2);
const isLiveRun = args.includes('--live');
const isVerbose = args.includes('--verbose');

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable not set');
  process.exit(1);
}

/**
 * Token mapping from old SEYU format to new single reference format
 * RULE: Database field name = Token name (no prefixes, no transformations)
 */
const TOKEN_MAPPINGS = {
  // Fans & Images
  'SEYUREMOTFANS': 'remoteFans',
  'SEYUSTADIUMFANS': 'stadium',
  'SEYUTOTALFANS': 'totalFans',
  'SEYUTOTALIMAGES': 'allImages',
  'SEYUALLIMAGES': 'allImages',
  
  // Images
  'SEYUREMOTEIMAGES': 'remoteImages',
  'SEYUHOSTESSIMAGES': 'hostessImages',
  'SEYUSELFIES': 'selfies',
  
  // Demographics
  'SEYUFEMALE': 'female',
  'SEYUMALE': 'male',
  'SEYUGENALPHA': 'genAlpha',
  'SEYUGENYZ': 'genYZ',
  'SEYUGENX': 'genX',
  'SEYUBOOMER': 'boomer',
  
  // Merchandise
  'SEYUMERCHEDFANS': 'merched',
  'SEYUMERCHERSEY': 'jersey',
  'SEYUMERCHSCARF': 'scarf',
  'SEYUMERCHFLAGS': 'flags',
  'SEYUMERCHBASEBALLCAP': 'baseballCap',
  'SEYUMERCHOTHER': 'other',
  
  // Event
  'SEYUATTENDEES': 'eventAttendees',
  'SEYUEVENTATTENDEES': 'eventAttendees',
  'SEYURESULTHOME': 'eventResultHome',
  'SEYURESULTVISITOR': 'eventResultVisitor',
  
  // Legacy tokens (without SEYU prefix)
  'INDOOR': 'remoteFans',  // Note: Legacy indoor -> new remoteFans
  'OUTDOOR': 'remoteFans',  // Note: Legacy outdoor -> combined into remoteFans
  'STADIUM': 'stadium',
  'TOTAL_FANS': 'totalFans',
  'REMOTE_FANS': 'remoteFans',
  'ALL_IMAGES': 'allImages',
  'TOTAL_IMAGES': 'allImages',
};

/**
 * Migrate a single formula string
 */
function migrateFormula(formula) {
  if (!formula) return { formula, changed: false, replacements: [] };
  
  let newFormula = formula;
  const replacements = [];
  
  // Replace each old token with new token
  for (const [oldToken, newToken] of Object.entries(TOKEN_MAPPINGS)) {
    const regex = new RegExp(`\\[${oldToken}\\]`, 'gi');
    if (regex.test(newFormula)) {
      newFormula = newFormula.replace(regex, `[${newToken}]`);
      replacements.push({ from: `[${oldToken}]`, to: `[${newToken}]` });
    }
  }
  
  return {
    formula: newFormula,
    changed: replacements.length > 0,
    replacements
  };
}

async function migrateChartFormulas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chart_configurations');
    
    // Find all charts
    console.log('🔍 Searching for charts with old token formats...\n');
    
    const allCharts = await chartsCollection.find({}).toArray();
    console.log(`📊 Found ${allCharts.length} total charts\n`);
    
    // Analyze which charts need migration
    const chartsToMigrate = [];
    
    for (const chart of allCharts) {
      let needsMigration = false;
      const elementChanges = [];
      
      if (chart.elements && Array.isArray(chart.elements)) {
        for (const element of chart.elements) {
          if (element.formula) {
            const result = migrateFormula(element.formula);
            if (result.changed) {
              needsMigration = true;
              elementChanges.push({
                elementId: element.id,
                elementLabel: element.label,
                oldFormula: element.formula,
                newFormula: result.formula,
                replacements: result.replacements
              });
            }
          }
        }
      }
      
      if (needsMigration) {
        chartsToMigrate.push({
          ...chart,
          elementChanges
        });
      }
    }
    
    console.log(`🎯 Found ${chartsToMigrate.length} charts that need migration\n`);
    
    if (chartsToMigrate.length === 0) {
      console.log('✨ All charts already use new token format! No work needed.\n');
      return;
    }
    
    // Show migration preview
    console.log('📋 MIGRATION PREVIEW:');
    console.log('='.repeat(80));
    
    chartsToMigrate.forEach((chart, index) => {
      if (isVerbose || index < 3) {
        console.log(`\n📊 Chart: ${chart.title} (${chart.chartId})`);
        console.log(`   Type: ${chart.type}`);
        chart.elementChanges.forEach(change => {
          console.log(`\n   Element: ${change.elementLabel}`);
          console.log(`   OLD: ${change.oldFormula}`);
          console.log(`   NEW: ${change.newFormula}`);
          change.replacements.forEach(rep => {
            console.log(`        - ${rep.from} → ${rep.to}`);
          });
        });
      }
    });
    
    if (chartsToMigrate.length > 3 && !isVerbose) {
      console.log(`\n   ... and ${chartsToMigrate.length - 3} more charts`);
      console.log('   (use --verbose to see all)');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📈 MIGRATION SUMMARY:`);
    console.log(`   Charts to migrate: ${chartsToMigrate.length}`);
    
    // Count total token replacements
    let totalReplacements = 0;
    chartsToMigrate.forEach(chart => {
      chart.elementChanges.forEach(change => {
        totalReplacements += change.replacements.length;
      });
    });
    console.log(`   Total token replacements: ${totalReplacements}`);
    
    if (!isLiveRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes applied');
      console.log('   Run with --live flag to apply changes to database');
      console.log('\n   Example: npm run migrate:chart-formulas -- --live\n');
      return;
    }
    
    // LIVE RUN: Apply migration
    console.log('\n🚀 LIVE RUN: Applying migration...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const chart of chartsToMigrate) {
      try {
        // Update elements with new formulas
        const updatedElements = chart.elements.map(element => {
          const change = chart.elementChanges.find(c => c.elementId === element.id);
          if (change) {
            return {
              ...element,
              formula: change.newFormula
            };
          }
          return element;
        });
        
        // Update chart in database
        const result = await chartsCollection.updateOne(
          { _id: chart._id },
          {
            $set: {
              elements: updatedElements,
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          successCount++;
          if (isVerbose) {
            console.log(`✅ Migrated: ${chart.title}`);
          }
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          chartId: chart.chartId,
          title: chart.title,
          error: error.message
        });
        console.error(`❌ Error migrating ${chart.title}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('✨ MIGRATION COMPLETE!\n');
    console.log(`✅ Successfully migrated: ${successCount} charts`);
    
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} charts`);
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`   - ${err.title} (${err.chartId}): ${err.error}`);
      });
    }
    
    console.log('\n📊 DATABASE STATE:');
    const totalCharts = await chartsCollection.countDocuments();
    console.log(`   Total charts: ${totalCharts}`);
    console.log(`   Migrated charts: ${successCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ALL CHARTS SUCCESSFULLY MIGRATED!\n');
    }
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migration
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║   SINGLE REFERENCE SYSTEM - Chart Formula Migration Script   ║');
console.log('║            [SEYU...] tokens → [fieldName] tokens             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log(`Mode: ${isLiveRun ? '🔴 LIVE RUN (changes will be applied)' : '🟡 DRY RUN (no changes)'}`);
console.log(`Verbose: ${isVerbose ? 'ON' : 'OFF'}\n`);

migrateChartFormulas()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
