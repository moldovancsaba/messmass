#!/usr/bin/env tsx
/**
 * WHAT: Verify formulas only use fields that exist in MongoDB
 * WHY: Prevent using non-existent field names like szerencsejatekAllPerson
 * HOW: Check each variable in formulas against actual MongoDB fields
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function verifyAndFixFormulas() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
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
    
    console.log(`📊 Found ${mongoFields.size} unique fields in MongoDB projects.stats\n`);
    
    // Get all charts
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    console.log(`🔍 Checking ${charts.length} charts for invalid field names...\n`);
    console.log('='.repeat(80));
    
    let invalidCount = 0;
    const invalidFields = new Set<string>();
    
    // Extract all variable names from formulas
    const variableRegex = /\[stats\.([a-zA-Z0-9_]+)\]/g;
    
    for (const chart of charts) {
      const formulas: string[] = [];
      
      if (chart.formula) formulas.push(chart.formula);
      if (chart.elements && Array.isArray(chart.elements)) {
        chart.elements.forEach((el: any) => {
          if (el.formula) formulas.push(el.formula);
        });
      }
      
      for (const formula of formulas) {
        let match;
        while ((match = variableRegex.exec(formula)) !== null) {
          const fieldName = match[1];
          
          // Check if field exists in MongoDB
          if (!mongoFields.has(fieldName)) {
            invalidFields.add(fieldName);
            invalidCount++;
            console.log(`❌ Chart "${chart.title}" (${chart.chartId}):`);
            console.log(`   Formula: ${formula}`);
            console.log(`   Invalid field: [stats.${fieldName}]`);
            console.log(`   Field "${fieldName}" does NOT exist in MongoDB!\n`);
          }
        }
      }
    }
    
    console.log('='.repeat(80));
    
    if (invalidCount === 0) {
      console.log('\n✅ All formulas use valid MongoDB field names!\n');
    } else {
      console.log(`\n⚠️  Found ${invalidCount} invalid field references`);
      console.log(`\nInvalid fields (${invalidFields.size}):`);
      Array.from(invalidFields).sort().forEach(f => console.log(`  - ${f}`));
      console.log(`\n❌ These fields do NOT exist in MongoDB and formulas will fail!\n`);
      console.log('📋 Next steps:');
      console.log('  1. Check if these fields should be registered in KYC');
      console.log('  2. Or update formulas to use correct field names');
      console.log('  3. Or remove charts using invalid fields\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyAndFixFormulas();

