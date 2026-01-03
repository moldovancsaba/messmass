#!/usr/bin/env tsx
/**
 * WHAT: Comprehensive fix for chart formulas and KYC variable alignment
 * WHY: Ensure all formulas use proper [stats.fieldName] format and variables match MongoDB field names
 * HOW: 
 * 1. Migrate all chart formulas to [stats.fieldName] format
 * 2. Verify KYC variables match MongoDB field names
 * 3. Report any mismatches
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * WHAT: Convert all formula formats to proper [stats.fieldName] format
 * WHY: Enforce consistent variable naming aligned with MongoDB Atlas field names
 */
function migrateFormula(formula: string): string {
  if (!formula || typeof formula !== 'string') {
    return formula;
  }

  let migrated = formula;

  // STEP 1: Convert [fieldName] to [stats.fieldName]
  const oldBracketedRegex = /\[(?!(?:stats\.|PARAM:|MANUAL:|MEDIA:|TEXT:))([a-zA-Z0-9_]+)\]/g;
  migrated = migrated.replace(oldBracketedRegex, (match, fieldName) => {
    return `[stats.${fieldName}]`;
  });

  // STEP 2: Convert stats.fieldName (without brackets) to [stats.fieldName]
  const nonBracketedRegex = /(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g;
  migrated = migrated.replace(nonBracketedRegex, (match, fieldName) => {
    return `[stats.${fieldName}]`;
  });

  return migrated;
}

/**
 * WHAT: Get all actual field names from MongoDB projects.stats
 * WHY: Verify KYC variables match actual database fields
 */
async function getMongoDBFieldNames(db: any): Promise<Set<string>> {
  const projects = await db.collection('projects').find({}).toArray();
  const fieldNames = new Set<string>();
  
  projects.forEach((project: any) => {
    if (project.stats) {
      Object.keys(project.stats).forEach((key: string) => {
        fieldNames.add(key);
      });
    }
  });
  
  return fieldNames;
}

/**
 * WHAT: Get all KYC variable names from variables_metadata
 * WHY: Compare with MongoDB field names to find mismatches
 */
async function getKYCVariableNames(db: any): Promise<Set<string>> {
  const variables = await db.collection('variables_metadata').find({}).toArray();
  const varNames = new Set<string>();
  
  variables.forEach((var_: any) => {
    if (var_.name && var_.name.startsWith('stats.')) {
      // Extract field name (remove stats. prefix)
      const fieldName = var_.name.replace(/^stats\./, '');
      varNames.add(fieldName);
    }
  });
  
  return varNames;
}

/**
 * WHAT: Main migration and verification function
 */
async function fixFormulasAndVariables() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // ==========================================
    // PART 1: Migrate Chart Formulas
    // ==========================================
    console.log('📊 PART 1: Migrating Chart Formulas\n');
    console.log('='.repeat(80));
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    console.log(`Found ${charts.length} total charts\n`);
    
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
          console.log(`  ✅ Chart "${chart.title}" (${chart.chartId}): formula updated`);
          console.log(`     OLD: ${chart.formula}`);
          console.log(`     NEW: ${newFormula}\n`);
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
              console.log(`  ✅ Chart "${chart.title}" (${chart.chartId}): element ${idx + 1} formula updated`);
              console.log(`     OLD: ${el.formula}`);
              console.log(`     NEW: ${newFormula}\n`);
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
    
    console.log('='.repeat(80));
    console.log(`\n✅ Formula Migration Complete:`);
    console.log(`  - Charts updated: ${updatedCount}`);
    console.log(`  - Main formulas updated: ${formulaCount}`);
    console.log(`  - Element formulas updated: ${elementCount}\n`);
    
    // ==========================================
    // PART 2: Verify KYC Variables vs MongoDB Fields
    // ==========================================
    console.log('📋 PART 2: Verifying KYC Variables vs MongoDB Field Names\n');
    console.log('='.repeat(80));
    
    const mongoFields = await getMongoDBFieldNames(db);
    const kycVars = await getKYCVariableNames(db);
    
    console.log(`\nMongoDB Stats Fields: ${mongoFields.size}`);
    console.log(`KYC Variables (stats.*): ${kycVars.size}\n`);
    
    // Find fields in MongoDB but not in KYC
    const inMongoButNotKYC = Array.from(mongoFields).filter(f => !kycVars.has(f));
    if (inMongoButNotKYC.length > 0) {
      console.log(`⚠️  Fields in MongoDB but NOT in KYC (${inMongoButNotKYC.length}):`);
      inMongoButNotKYC.slice(0, 20).forEach(f => console.log(`  - ${f}`));
      if (inMongoButNotKYC.length > 20) {
        console.log(`  ... and ${inMongoButNotKYC.length - 20} more`);
      }
      console.log();
    }
    
    // Find variables in KYC but not in MongoDB
    const inKYCButNotMongo = Array.from(kycVars).filter(f => !mongoFields.has(f));
    if (inKYCButNotMongo.length > 0) {
      console.log(`⚠️  Variables in KYC but NOT in MongoDB (${inKYCButNotMongo.length}):`);
      inKYCButNotMongo.slice(0, 20).forEach(f => console.log(`  - ${f}`));
      if (inKYCButNotMongo.length > 20) {
        console.log(`  ... and ${inKYCButNotMongo.length - 20} more`);
      }
      console.log();
    }
    
    if (inMongoButNotKYC.length === 0 && inKYCButNotMongo.length === 0) {
      console.log('✅ All KYC variables match MongoDB field names!\n');
    }
    
    console.log('='.repeat(80));
    console.log('\n✅ Migration and Verification Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
fixFormulasAndVariables();

