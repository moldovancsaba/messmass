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
 * WHAT: Convert old format [fieldName] to new format [stats.fieldName]
 * WHY: Enforce consistent variable naming
 * HOW: Regex replacement for bracketed variables
 */
function migrateFormula(formula: string): string {
  if (!formula || typeof formula !== 'string') {
    return formula;
  }

  // WHAT: Match [fieldName] pattern where fieldName doesn't start with stats.
  // WHY: Only update old format, preserve [stats.fieldName] and special tokens
  // HOW: Negative lookahead to exclude stats., PARAM:, MANUAL:, MEDIA:, TEXT:
  const oldFormatRegex = /\[(?!(?:stats\.|PARAM:|MANUAL:|MEDIA:|TEXT:))([a-zA-Z0-9_]+)\]/g;
  
  return formula.replace(oldFormatRegex, (match, fieldName) => {
    // Convert [fieldName] to [stats.fieldName]
    return `[stats.${fieldName}]`;
  });
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

