#!/usr/bin/env tsx
/**
 * WHAT: Fix formulas to use correct MongoDB field names
 * WHY: Some formulas use field names that don't exist (e.g., reportText11-15, wrong bitly fields)
 * HOW: Map invalid field names to correct ones or remove formulas
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Field name corrections: invalid -> correct (empty string = remove formula)
const FIELD_CORRECTIONS: Record<string, string> = {
  // Report text fields - only 1-10 exist, remove 11-15
  'reportText11': '', // Remove formula - field doesn't exist
  'reportText12': '',
  'reportText13': '',
  'reportText14': '',
  'reportText15': '',
  
  // Bitly fields - use correct names that exist
  'bitlyMobileClicks': 'bitlyClicksFromQRCode', // Use existing field
  'bitlySocialClicks': '', // Remove - calculate manually if needed: bitlyClicksFromFacebook + bitlyClicksFromInstagram
  
  // Games fields - only these exist: gamesWithAds, gamesWithSelfie, totalGames
  'gamesWithoutAds': '', // Remove - doesn't exist
  'gamesWithoutSlideshow': '', // Remove - doesn't exist
  'gamesWithSlideshow': '', // Remove - doesn't exist
  
  // Other invalid fields
  'SEYUSTADIUMFANS': '', // Remove - doesn't exist
  'socialVisit': '', // Remove - doesn't exist
  'topCountryfive': 'bitlyTopCountry', // Use correct field name
};

// Szerencse field name corrections (check actual vs used)
const SZERENCSE_CORRECTIONS: Record<string, string> = {
  'szerencsejatekHostessAllphotos': 'szerencsejatekHostessAllphotos', // This exists, keep it
  'szerencsejatekAllusersAllphotos': 'szerencsejatekAllusersAllphotos', // This exists, keep it
};

async function fixInvalidFieldNames() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Get all actual MongoDB field names
    const projects = await db.collection('projects').find({}).toArray();
    const mongoFields = new Set<string>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          mongoFields.add(key);
        });
      }
    });
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    console.log(`🔍 Fixing invalid field names in ${charts.length} charts...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    const variableRegex = /\[stats\.([a-zA-Z0-9_]+)\]/g;
    
    function fixFormula(formula: string): string | null {
      let fixed = formula;
      let hasInvalid = false;
      
      // Check all variables in formula
      const matches: Array<{ match: string; fieldName: string }> = [];
      let match;
      const regex = new RegExp(variableRegex);
      while ((match = regex.exec(formula)) !== null) {
        matches.push({ match: match[0], fieldName: match[1] });
      }
      
      // Check each variable
      for (const { match: fullMatch, fieldName } of matches) {
        if (!mongoFields.has(fieldName)) {
          // Field doesn't exist - check for correction
          if (FIELD_CORRECTIONS[fieldName]) {
            const correction = FIELD_CORRECTIONS[fieldName];
            if (correction === '') {
              // Field should be removed - invalidate entire formula
              hasInvalid = true;
              break;
            } else {
              // Use corrected field name
              fixed = fixed.replace(fullMatch, `[stats.${correction}]`);
            }
          } else {
            // Unknown invalid field - invalidate formula
            hasInvalid = true;
            break;
          }
        }
      }
      
      // If formula has invalid fields that can't be corrected, return null to remove it
      if (hasInvalid) {
        return null;
      }
      
      return fixed !== formula ? fixed : formula;
    }
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Fix main formula
      if (chart.formula) {
        const fixedFormula = fixFormula(chart.formula);
        if (fixedFormula === null) {
          // Remove invalid formula
          updates.formula = '';
          needsUpdate = true;
          console.log(`❌ Chart "${chart.title}" (${chart.chartId}):`);
          console.log(`   REMOVING invalid formula: ${chart.formula}`);
          console.log(`   Reason: Contains fields that don't exist in MongoDB\n`);
        } else if (fixedFormula !== chart.formula) {
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
            const fixedFormula = fixFormula(el.formula);
            if (fixedFormula === null) {
              // Remove invalid formula
              needsUpdate = true;
              console.log(`❌ Chart "${chart.title}" (${chart.chartId}) element:`);
              console.log(`   REMOVING invalid formula: ${el.formula}`);
              console.log(`   Reason: Contains fields that don't exist in MongoDB\n`);
              return { ...el, formula: '' };
            } else if (fixedFormula !== el.formula) {
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
      
      // Update chart if needed
      if (needsUpdate) {
        await chartsCollection.updateOne(
          { _id: chart._id },
          { $set: updates }
        );
        updatedCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Fixed ${updatedCount} charts with invalid field names\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixInvalidFieldNames();

