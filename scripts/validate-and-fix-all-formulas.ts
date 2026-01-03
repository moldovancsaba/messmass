#!/usr/bin/env tsx
/**
 * WHAT: Validate ALL formulas use ONLY fields that exist in MongoDB
 * WHY: Formulas using non-existent fields will always fail
 * HOW: Remove or fix formulas with invalid field references
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function validateAndFixAllFormulas() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Get ALL actual MongoDB field names from projects.stats
    const projects = await db.collection('projects').find({}).toArray();
    const mongoFields = new Set<string>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          mongoFields.add(key);
        });
      }
    });
    
    console.log(`📊 Found ${mongoFields.size} unique fields in MongoDB\n`);
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    console.log(`🔍 Validating ${charts.length} charts...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    let removedCount = 0;
    const variableRegex = /\[stats\.([a-zA-Z0-9_]+)\]/g;
    
    function validateFormula(formula: string): { valid: boolean; invalidFields: string[] } {
      const invalidFields: string[] = [];
      let match;
      const regex = new RegExp(variableRegex);
      
      while ((match = regex.exec(formula)) !== null) {
        const fieldName = match[1];
        if (!mongoFields.has(fieldName)) {
          invalidFields.push(fieldName);
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
          // Remove invalid formula
          updates.formula = '';
          needsUpdate = true;
          removedCount++;
          console.log(`❌ Chart "${chart.title}" (${chart.chartId}):`);
          console.log(`   REMOVING formula: ${chart.formula}`);
          console.log(`   Invalid fields: ${validation.invalidFields.join(', ')}`);
          console.log(`   These fields do NOT exist in MongoDB!\n`);
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
              console.log(`   These fields do NOT exist in MongoDB!\n`);
              return { ...el, formula: '' };
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
    console.log(`\n✅ Validation complete:`);
    console.log(`  - Charts updated: ${updatedCount}`);
    console.log(`  - Formulas removed: ${removedCount}`);
    console.log(`\n📋 All remaining formulas use ONLY fields that exist in MongoDB!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

validateAndFixAllFormulas();

