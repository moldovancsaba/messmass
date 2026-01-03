#!/usr/bin/env tsx
/**
 * WHAT: Migrate chart formulas from old [fieldName] format to new [stats.fieldName] format
 * WHY: Enforce consistent variable naming and remove backward compatibility code
 * HOW: Update all chart configurations in MongoDB chart_configurations collection
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * WHAT: Convert all formula formats to proper [stats.fieldName] format
 * WHY: Enforce consistent variable naming aligned with MongoDB Atlas field names
 * HOW: Handle multiple formats: [fieldName], stats.fieldName, [stats.fieldName]
 */
function migrateFormula(formula: string): string {
  if (!formula || typeof formula !== 'string') {
    return formula;
  }

  let migrated = formula;

  // STEP 1: Convert [fieldName] to [stats.fieldName] (old bracketed format without stats. prefix)
  // WHAT: Match [fieldName] where fieldName doesn't start with stats. or special tokens
  // WHY: Old charts used [female] instead of [stats.female]
  // HOW: Negative lookahead to exclude stats., PARAM:, MANUAL:, MEDIA:, TEXT:
  const oldBracketedRegex = /\[(?!(?:stats\.|PARAM:|MANUAL:|MEDIA:|TEXT:))([a-zA-Z0-9_]+)\]/g;
  migrated = migrated.replace(oldBracketedRegex, (match, fieldName) => {
    // Convert [fieldName] to [stats.fieldName]
    return `[stats.${fieldName}]`;
  });

  // STEP 2: Convert stats.fieldName (without brackets) to [stats.fieldName]
  // WHAT: Match stats.fieldName pattern that is NOT already inside brackets
  // WHY: Some charts use "stats.female" without brackets
  // HOW: Use negative lookbehind and lookahead to avoid double-substitution
  const nonBracketedRegex = /(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g;
  migrated = migrated.replace(nonBracketedRegex, (match, fieldName) => {
    // Convert stats.fieldName to [stats.fieldName]
    return `[stats.${fieldName}]`;
  });

  return migrated;
}

/**
 * WHAT: Migrate all chart formulas in database
 * WHY: Ensure all charts use consistent [stats.fieldName] format
 */
async function migrateChartFormulas() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chart_configurations');
    
    console.log('🔍 Finding charts with old formula format...');
    
    // Find all charts
    const charts = await chartsCollection.find({}).toArray();
    console.log(`📊 Found ${charts.length} total charts`);
    
    let updatedCount = 0;
    let formulaCount = 0;
    let elementCount = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Migrate main formula
      if (chart.formula) {
        const newFormula = migrateFormula(chart.formula);
        if (newFormula !== chart.formula) {
          updates.formula = newFormula;
          needsUpdate = true;
          formulaCount++;
          console.log(`  📝 Chart "${chart.title}" (${chart.chartId}): formula updated`);
        }
      }
      
      // Migrate element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any, idx: number) => {
          if (el.formula) {
            const newFormula = migrateFormula(el.formula);
            if (newFormula !== el.formula) {
              needsUpdate = true;
              elementCount++;
              console.log(`  📝 Chart "${chart.title}" (${chart.chartId}): element ${idx + 1} formula updated`);
              return { ...el, formula: newFormula };
            }
          }
          return el;
        });
        
        if (needsUpdate) {
          updates.elements = updatedElements;
        }
      }
      
      // Update chart if needed
      if (needsUpdate) {
        await chartsCollection.updateOne(
          { _id: chart._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`  - Charts updated: ${updatedCount}`);
    console.log(`  - Main formulas updated: ${formulaCount}`);
    console.log(`  - Element formulas updated: ${elementCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
migrateChartFormulas();


