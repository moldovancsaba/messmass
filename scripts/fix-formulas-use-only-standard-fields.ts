#!/usr/bin/env tsx
/**
 * WHAT: Fix formulas to use ONLY standard fields that exist in most projects
 * WHY: Project-specific fields (like szerencsejatek*) only exist in 2/224 projects
 * HOW: Remove formulas using rare/project-specific fields, keep only standard fields
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Standard fields that should exist in all/most projects
const STANDARD_FIELDS = new Set([
  // Core image stats
  'remoteImages', 'hostessImages', 'selfies',
  // Location stats
  'indoor', 'outdoor', 'stadium',
  // Demographics
  'female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer',
  // Merchandise
  'merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other',
  // Derived/computed
  'remoteFans', 'totalFans', 'allImages',
  // Report content (standard range)
  'reportText1', 'reportText2', 'reportText3', 'reportText4', 'reportText5',
  'reportText6', 'reportText7', 'reportText8', 'reportText9', 'reportText10',
  'reportImage1', 'reportImage2', 'reportImage3', 'reportImage4', 'reportImage5',
  'reportImage6', 'reportImage7', 'reportImage8', 'reportImage9', 'reportImage10',
  // Bitly (standard fields)
  'bitlyTotalClicks', 'bitlyUniqueClicks', 'bitlyCountryCount', 'bitlyTopCountry',
  'bitlyCountry1Clicks', 'bitlyCountry2Clicks', 'bitlyCountry3Clicks',
  'bitlyCountry4Clicks', 'bitlyCountry5Clicks',
  'bitlyClicksFromQRCode', 'bitlyClicksFromFacebook', 'bitlyClicksFromInstagram',
  // Event fields
  'eventAttendees', 'eventTicketPurchases', 'eventValuePropositionVisited',
  'eventValuePropositionPurchases', 'directUrl',
  // Analytics
  'uniqueUsers', 'newUsersAdded', 'marketingOptin',
  'ventFacebook', 'ventInstagram', 'ventCtaPopup', 'specialMerch',
  // Images
  'approvedImages', 'rejectedImages',
]);

async function fixFormulasUseOnlyStandardFields() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Get field frequency (how many projects have each field)
    const projects = await db.collection('projects').find({}).toArray();
    const fieldFrequency = new Map<string, number>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          fieldFrequency.set(key, (fieldFrequency.get(key) || 0) + 1);
        });
      }
    });
    
    const totalProjects = projects.length;
    console.log(`📊 Analyzing ${totalProjects} projects...\n`);
    
    // Fields that exist in < 10% of projects are considered project-specific
    const MIN_PERCENTAGE = 0.1; // 10%
    const minProjects = Math.ceil(totalProjects * MIN_PERCENTAGE);
    
    console.log(`📋 Standard fields (exist in all/most projects): ${STANDARD_FIELDS.size}`);
    console.log(`📋 Project-specific fields (exist in < ${Math.round(MIN_PERCENTAGE * 100)}% of projects) will be removed\n`);
    console.log('='.repeat(80));
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    let updatedCount = 0;
    let removedCount = 0;
    const variableRegex = /\[stats\.([a-zA-Z0-9_]+)\]/g;
    
    function validateFormula(formula: string): { valid: boolean; invalidFields: string[] } {
      const invalidFields: string[] = [];
      let match;
      const regex = new RegExp(variableRegex);
      
      while ((match = regex.exec(formula)) !== null) {
        const fieldName = match[1];
        
        // Check if it's a standard field
        if (STANDARD_FIELDS.has(fieldName)) {
          continue; // Valid
        }
        
        // Check if field exists in enough projects
        const frequency = fieldFrequency.get(fieldName) || 0;
        if (frequency < minProjects) {
          invalidFields.push(`${fieldName} (exists in ${frequency}/${totalProjects} projects)`);
        }
      }
      
      return {
        valid: invalidFields.length === 0,
        invalidFields
      };
    }
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Validate main formula
      if (chart.formula) {
        const validation = validateFormula(chart.formula);
        if (!validation.valid) {
          updates.formula = '';
          needsUpdate = true;
          removedCount++;
          console.log(`❌ Chart "${chart.title}" (${chart.chartId}):`);
          console.log(`   REMOVING formula: ${chart.formula}`);
          console.log(`   Invalid fields: ${validation.invalidFields.join(', ')}`);
          console.log(`   Reason: Fields are project-specific or don't exist in enough projects\n`);
        }
      }
      
      // Validate element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any) => {
          if (el.formula) {
            const validation = validateFormula(el.formula);
            if (!validation.valid) {
              needsUpdate = true;
              removedCount++;
              console.log(`❌ Chart "${chart.title}" (${chart.chartId}) element:`);
              console.log(`   REMOVING formula: ${el.formula}`);
              console.log(`   Invalid fields: ${validation.invalidFields.join(', ')}`);
              console.log(`   Reason: Fields are project-specific or don't exist in enough projects\n`);
              return { ...el, formula: '' };
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
    console.log(`\n✅ Fix complete:`);
    console.log(`  - Charts updated: ${updatedCount}`);
    console.log(`  - Formulas removed: ${removedCount}`);
    console.log(`\n📋 All remaining formulas use ONLY standard fields that exist in most projects!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixFormulasUseOnlyStandardFields();

