#!/usr/bin/env tsx
/**
 * WHAT: Remove or fix formulas that reference non-existent MongoDB fields
 * WHY: Formulas using non-existent fields will always return 'NA' or 0
 * HOW: Either remove invalid formulas or comment them out
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Fields that DO NOT exist in MongoDB (from verification)
const INVALID_FIELDS = new Set([
  'SEYUSTADIUMFANS',
  'bitlyMobileClicks',      // Should be: bitlyClicksFromQRCode or other bitly fields
  'bitlySocialClicks',      // Should be: bitlyClicksFromFacebook + bitlyClicksFromInstagram
  'gamesWithSlideshow',
  'gamesWithoutAds',
  'gamesWithoutSlideshow',
  'reportText11',           // Only reportText1-10 exist
  'reportText12',
  'reportText13',
  'reportText14',
  'reportText15',
  'socialVisit',            // Check actual field name
  'topCountryfive',         // Should be: bitlyTopCountry or bitlyCountry5
]);

async function removeInvalidFormulas() {
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
    
    console.log(`🔍 Checking ${charts.length} charts for invalid formulas...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    const variableRegex = /\[stats\.([a-zA-Z0-9_]+)\]/g;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check main formula
      if (chart.formula) {
        let hasInvalid = false;
        let match;
        const regex = new RegExp(variableRegex);
        while ((match = regex.exec(chart.formula)) !== null) {
          const fieldName = match[1];
          if (INVALID_FIELDS.has(fieldName) || !mongoFields.has(fieldName)) {
            hasInvalid = true;
            console.log(`❌ Chart "${chart.title}" (${chart.chartId}):`);
            console.log(`   Invalid field in formula: [stats.${fieldName}]`);
            console.log(`   Formula: ${chart.formula}`);
            break;
          }
        }
        
        if (hasInvalid) {
          // Remove formula (set to empty string or null)
          updates.formula = '';
          needsUpdate = true;
          console.log(`   → Removing invalid formula\n`);
        }
      }
      
      // Check element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any) => {
          if (el.formula) {
            let hasInvalid = false;
            let match;
            const regex = new RegExp(variableRegex);
            while ((match = regex.exec(el.formula)) !== null) {
              const fieldName = match[1];
              if (INVALID_FIELDS.has(fieldName) || !mongoFields.has(fieldName)) {
                hasInvalid = true;
                console.log(`❌ Chart "${chart.title}" (${chart.chartId}) element:`);
                console.log(`   Invalid field in formula: [stats.${fieldName}]`);
                console.log(`   Formula: ${el.formula}`);
                console.log(`   → Removing invalid formula\n`);
                break;
              }
            }
            
            if (hasInvalid) {
              return { ...el, formula: '' };
            }
          }
          return el;
        });
        
        // Check if any elements were updated
        const hasChanges = chart.elements.some((el: any, idx: number) => {
          const updated = updatedElements[idx];
          return updated && updated.formula !== el.formula;
        });
        
        if (hasChanges) {
          updates.elements = updatedElements;
          needsUpdate = true;
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
    console.log(`\n✅ Cleanup complete: ${updatedCount} charts updated\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

removeInvalidFormulas();

