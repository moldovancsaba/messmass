#!/usr/bin/env tsx
/**
 * WHAT: Remove "stats." prefix from EVERYWHERE
 * WHY: User wants to purge "stats." prefix completely
 * HOW: Update KYC variables, formulas, and ensure formula engine handles [fieldName] only
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * WHAT: Remove stats. prefix from variable name
 * WHY: Clean format without prefix
 */
function removeStatsPrefix(name: string): string {
  if (name.startsWith('stats.')) {
    return name.substring(6); // Remove "stats." prefix
  }
  return name;
}

/**
 * WHAT: Remove stats. prefix from formula variables
 * WHY: Convert [stats.fieldName] → [fieldName] and stats.fieldName → fieldName
 */
function cleanFormula(formula: string): string {
  if (!formula || typeof formula !== 'string') {
    return formula;
  }

  let cleaned = formula;

  // Convert [stats.fieldName] → [fieldName]
  cleaned = cleaned.replace(/\[stats\.([a-zA-Z0-9_]+)\]/g, (_match, fieldName) => {
    return `[${fieldName}]`;
  });

  // Convert stats.fieldName (without brackets) → fieldName
  cleaned = cleaned.replace(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g, (_match, fieldName) => {
    return fieldName;
  });

  return cleaned;
}

async function removeStatsPrefixEverywhere() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log('🗑️  Removing "stats." prefix from EVERYWHERE...\n');
    console.log('='.repeat(80));
    
    // ==========================================
    // PART 1: Update KYC Variables
    // ==========================================
    console.log('📊 PART 1: Updating KYC variables_metadata...\n');
    
    const variablesCollection = db.collection('variables_metadata');
    const allVariables = await variablesCollection.find({}).toArray();
    
    let kycUpdated = 0;
    let kycRemoved = 0;
    
    for (const variable of allVariables) {
      if (variable.name && variable.name.startsWith('stats.')) {
        const newName = removeStatsPrefix(variable.name);
        
        // Check if variable without prefix already exists
        const existing = await variablesCollection.findOne({ name: newName });
        
        if (existing) {
          // Remove the duplicate with "stats." prefix
          await variablesCollection.deleteOne({ _id: variable._id });
          kycRemoved++;
          if (kycRemoved <= 5) {
            console.log(`  🗑️  Removed duplicate: ${variable.name} (${newName} already exists)`);
          }
        } else {
          // Update to remove prefix
          await variablesCollection.updateOne(
            { _id: variable._id },
            { $set: { name: newName } }
          );
          kycUpdated++;
          if (kycUpdated <= 10) {
            console.log(`  ✅ ${variable.name} → ${newName}`);
          }
        }
      }
    }
    
    if (kycUpdated > 10) {
      console.log(`  ... and ${kycUpdated - 10} more variables`);
    }
    
    console.log(`\n✅ Updated ${kycUpdated} KYC variables`);
    if (kycRemoved > 0) {
      console.log(`   Removed ${kycRemoved} duplicate variables with "stats." prefix\n`);
    } else {
      console.log();
    }
    
    // ==========================================
    // PART 2: Update Chart Formulas
    // ==========================================
    console.log('📊 PART 2: Updating chart formulas...\n');
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    let chartsUpdated = 0;
    let formulasUpdated = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Update main formula
      if (chart.formula) {
        const cleanedFormula = cleanFormula(chart.formula);
        if (cleanedFormula !== chart.formula) {
          updates.formula = cleanedFormula;
          needsUpdate = true;
          formulasUpdated++;
          if (formulasUpdated <= 5) {
            console.log(`  ✅ Chart "${chart.title}" (${chart.chartId}):`);
            console.log(`     OLD: ${chart.formula}`);
            console.log(`     NEW: ${cleanedFormula}`);
          }
        }
      }
      
      // Update element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any) => {
          if (el.formula) {
            const cleanedFormula = cleanFormula(el.formula);
            if (cleanedFormula !== el.formula) {
              needsUpdate = true;
              formulasUpdated++;
              if (formulasUpdated <= 5) {
                console.log(`  ✅ Chart "${chart.title}" element:`);
                console.log(`     OLD: ${el.formula}`);
                console.log(`     NEW: ${cleanedFormula}`);
              }
              return { ...el, formula: cleanedFormula };
            }
          }
          return el;
        });
        
        if (needsUpdate) {
          updates.elements = updatedElements;
        }
      }
      
      if (needsUpdate) {
        await chartsCollection.updateOne(
          { _id: chart._id },
          { $set: updates }
        );
        chartsUpdated++;
      }
    }
    
    if (formulasUpdated > 5) {
      console.log(`  ... and ${formulasUpdated - 5} more formulas`);
    }
    
    console.log(`\n✅ Updated ${chartsUpdated} charts (${formulasUpdated} formulas)\n`);
    
    console.log('='.repeat(80));
    console.log(`\n✅ PURGE COMPLETE:`);
    console.log(`  - KYC variables updated: ${kycUpdated}`);
    console.log(`  - Chart formulas updated: ${formulasUpdated}`);
    console.log(`\n✅ "stats." prefix removed from EVERYWHERE!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

removeStatsPrefixEverywhere();

