#!/usr/bin/env tsx
/**
 * WHAT: Fix formulas to use correct format [fieldName] instead of [stats.fieldName]
 * WHY: stats parameter is already the stats object, so [stats.fieldName] is wrong
 * HOW: Convert [stats.fieldName] → [fieldName] in all chart formulas
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

function fixFormulaFormat(formula: string): string {
  if (!formula || typeof formula !== 'string') {
    return formula;
  }

  let fixed = formula;

  // Convert [stats.fieldName] → [fieldName]
  fixed = fixed.replace(/\[stats\.([a-zA-Z0-9_]+)\]/g, (_match, fieldName) => {
    return `[${fieldName}]`;
  });

  // Convert stats.fieldName (without brackets) → fieldName (keep for backward compatibility)
  // Note: This is handled by formulaEngine, but we can also update formulas directly
  fixed = fixed.replace(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g, (_match, fieldName) => {
    return fieldName;
  });

  return fixed;
}

async function fixFormulasToCorrectFormat() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    console.log(`🔍 Fixing formula format in ${charts.length} charts...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Fix main formula
      if (chart.formula) {
        const fixedFormula = fixFormulaFormat(chart.formula);
        if (fixedFormula !== chart.formula) {
          updates.formula = fixedFormula;
          needsUpdate = true;
          console.log(`✅ Chart "${chart.title}" (${chart.chartId}):`);
          console.log(`   OLD: ${chart.formula}`);
          console.log(`   NEW: ${fixedFormula}\n`);
        }
      }
      
      // Fix element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any) => {
          if (el.formula) {
            const fixedFormula = fixFormulaFormat(el.formula);
            if (fixedFormula !== el.formula) {
              needsUpdate = true;
              console.log(`✅ Chart "${chart.title}" (${chart.chartId}) element:`);
              console.log(`   OLD: ${el.formula}`);
              console.log(`   NEW: ${fixedFormula}\n`);
              return { ...el, formula: fixedFormula };
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
        updatedCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Fixed ${updatedCount} charts to use correct format [fieldName]\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixFormulasToCorrectFormat();

