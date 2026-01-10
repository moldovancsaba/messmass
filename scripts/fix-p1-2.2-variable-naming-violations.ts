#!/usr/bin/env tsx
/**
 * P1 2.2: Fix Variable Naming Violations
 * 
 * WHAT: Fix KYC variable name violation and chart formula violations
 * WHY: Align with Variable Dictionary standards
 * HOW: 
 *   1. Rename Caps → caps in variables_metadata
 *   2. Replace stats.reportImageX with [reportImageX] in chart_configurations
 *   3. Replace stats.reportTextX with [reportTextX] in chart_configurations
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixVariableNamingViolations() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    console.log('🔧 P1 2.2: Fixing Variable Naming Violations\n');
    console.log('='.repeat(80));

    // ==========================================
    // PART 1: Fix KYC Variable Name Violation
    // ==========================================
    console.log('\n📊 PART 1: Fixing KYC Variable Name Violation (Caps → caps)...\n');

    const variablesCollection = db.collection('variables_metadata');
    
    // Find the Caps variable
    const capsVariable = await variablesCollection.findOne({ name: 'Caps' });
    
    if (capsVariable) {
      // Check if 'caps' already exists
      const existingCaps = await variablesCollection.findOne({ name: 'caps' });
      
      if (existingCaps) {
        console.log('  ⚠️  Variable "caps" already exists. Checking if "Caps" is duplicate...');
        // If it's a duplicate, delete the "Caps" one
        await variablesCollection.deleteOne({ _id: capsVariable._id });
        console.log('  ✅ Removed duplicate variable "Caps" (caps already exists)');
      } else {
        // Rename Caps to caps
        await variablesCollection.updateOne(
          { _id: capsVariable._id },
          { 
            $set: { 
              name: 'caps',
              updatedAt: new Date().toISOString(),
              updatedBy: 'system'
            } 
          }
        );
        console.log('  ✅ Renamed variable: Caps → caps');
      }
    } else {
      console.log('  ℹ️  Variable "Caps" not found (may have been fixed already)');
    }

    // ==========================================
    // PART 2: Fix Chart Formula Violations
    // ==========================================
    console.log('\n📊 PART 2: Fixing Chart Formula Violations...\n');

    const chartsCollection = db.collection('chart_configurations');
    const allCharts = await chartsCollection.find({}).toArray();

    let chartsUpdated = 0;
    let formulasFixed = 0;

    for (const chart of allCharts) {
      let needsUpdate = false;
      const updates: any = {};

      // Fix main formula
      if (chart.formula && typeof chart.formula === 'string') {
        let fixedFormula = chart.formula;
        
        // Replace stats.reportImageX with [reportImageX]
        fixedFormula = fixedFormula.replace(/stats\.reportImage(\d+)/g, '[reportImage$1]');
        // Replace stats.reportTextX with [reportTextX]
        fixedFormula = fixedFormula.replace(/stats\.reportText(\d+)/g, '[reportText$1]');
        
        if (fixedFormula !== chart.formula) {
          updates.formula = fixedFormula;
          needsUpdate = true;
          formulasFixed++;
          console.log(`  ✅ Chart "${chart.chartId}": formula updated`);
        }
      }

      // Fix element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((element: any, idx: number) => {
          if (element.formula && typeof element.formula === 'string') {
            let fixedFormula = element.formula;
            
            // Replace stats.reportImageX with [reportImageX]
            fixedFormula = fixedFormula.replace(/stats\.reportImage(\d+)/g, '[reportImage$1]');
            // Replace stats.reportTextX with [reportTextX]
            fixedFormula = fixedFormula.replace(/stats\.reportText(\d+)/g, '[reportText$1]');
            
            if (fixedFormula !== element.formula) {
              formulasFixed++;
              console.log(`  ✅ Chart "${chart.chartId}", element ${idx + 1}: formula updated`);
              return { ...element, formula: fixedFormula };
            }
          }
          return element;
        });
        
        if (needsUpdate || updatedElements.some((el: any, idx: number) => 
          el.formula !== chart.elements[idx]?.formula
        )) {
          updates.elements = updatedElements;
          needsUpdate = true;
        }
      }

      // Update chart if needed
      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString();
        await chartsCollection.updateOne(
          { _id: chart._id },
          { $set: updates }
        );
        chartsUpdated++;
      }
    }

    console.log(`\n  Total charts updated: ${chartsUpdated}`);
    console.log(`  Total formulas fixed: ${formulasFixed}`);

    // ==========================================
    // PART 3: Summary
    // ==========================================
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ MIGRATION COMPLETE\n');
    console.log(`  - KYC variable fixed: Caps → caps`);
    console.log(`  - Chart formulas fixed: ${formulasFixed}`);
    console.log(`  - Charts updated: ${chartsUpdated}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
fixVariableNamingViolations().catch(console.error);
