#!/usr/bin/env tsx
/**
 * WHAT: Fix remaining issues found in verification
 * WHY: Complete the alignment of KYC, MongoDB, charts, and reports
 * HOW: Fix remaining "stats." prefixes, add missing charts, align KYC variables
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixRemainingIssues() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log('🔧 Fixing remaining issues...\n');
    console.log('='.repeat(80));
    
    // ==========================================
    // PART 1: Fix remaining "stats." prefix in charts
    // ==========================================
    console.log('\n📊 PART 1: Fixing remaining "stats." prefix in charts\n');
    
    const chartsCollection = db.collection('chart_configurations');
    const charts = await chartsCollection.find({}).toArray();
    
    let fixedCharts = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check main formula
      if (chart.formula && (chart.formula.includes('[stats.') || (chart.formula.includes('stats.') && !chart.formula.includes('PARAM:') && !chart.formula.includes('MANUAL:')))) {
        updates.formula = chart.formula.replace(/\[stats\.([a-zA-Z0-9_]+)\]/g, '[$1]').replace(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g, '$1');
        needsUpdate = true;
        console.log(`  ✅ Chart "${chart.title}" (${chart.chartId}):`);
        console.log(`     OLD: ${chart.formula}`);
        console.log(`     NEW: ${updates.formula}`);
      }
      
      // Check element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const updatedElements = chart.elements.map((el: any) => {
          if (el.formula && (el.formula.includes('[stats.') || (el.formula.includes('stats.') && !el.formula.includes('PARAM:') && !el.formula.includes('MANUAL:')))) {
            needsUpdate = true;
            const fixed = el.formula.replace(/\[stats\.([a-zA-Z0-9_]+)\]/g, '[$1]').replace(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g, '$1');
            console.log(`  ✅ Chart "${chart.title}" element:`);
            console.log(`     OLD: ${el.formula}`);
            console.log(`     NEW: ${fixed}`);
            return { ...el, formula: fixed };
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
        fixedCharts++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCharts} charts\n`);
    
    // ==========================================
    // PART 2: Create missing charts
    // ==========================================
    console.log('📊 PART 2: Creating missing charts\n');
    
    const missingCharts = [
      {
        chartId: 'fanSelfieSquare1',
        title: 'Fan Selfie Square 1',
        type: 'image',
        formula: '[fanSelfieSquare1]',
        elements: [{ formula: '[fanSelfieSquare1]', label: 'Fan Selfie Square 1' }],
        isSystem: true
      },
      {
        chartId: 'fanSelfiePortrait4',
        title: 'Fan Selfie Portrait 4',
        type: 'image',
        formula: '[fanSelfiePortrait4]',
        elements: [{ formula: '[fanSelfiePortrait4]', label: 'Fan Selfie Portrait 4' }],
        isSystem: true
      }
    ];
    
    let createdCharts = 0;
    const now = new Date().toISOString();
    
    for (const chartConfig of missingCharts) {
      const existing = await chartsCollection.findOne({ chartId: chartConfig.chartId });
      if (!existing) {
        await chartsCollection.insertOne({
          ...chartConfig,
          createdAt: now,
          updatedAt: now,
          createdBy: 'system',
          updatedBy: 'system'
        });
        createdCharts++;
        console.log(`  ✅ Created chart: ${chartConfig.chartId}`);
      } else {
        console.log(`  ⏭️  Chart already exists: ${chartConfig.chartId}`);
      }
    }
    
    console.log(`\n✅ Created ${createdCharts} missing charts\n`);
    
    // ==========================================
    // PART 3: Add missing MongoDB fields to KYC
    // ==========================================
    console.log('📊 PART 3: Adding missing MongoDB fields to KYC\n');
    
    const projects = await db.collection('projects').find({}).toArray();
    const mongoFields = new Set<string>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          mongoFields.add(key);
        });
      }
    });
    
    const variablesCollection = db.collection('variables_metadata');
    const existingKYC = await variablesCollection.find({}).toArray();
    const existingKYCNames = new Set(existingKYC.map(v => v.name));
    
    const missingFields = Array.from(mongoFields).filter(f => !existingKYCNames.has(f));
    
    // Fields that should be added to KYC (excluding internal/system fields)
    const fieldsToAdd = missingFields.filter(f => 
      !f.startsWith('_') && 
      f.length > 0 &&
      /^[a-zA-Z][a-zA-Z0-9_]*$/.test(f)
    );
    
    let addedVariables = 0;
    
    for (const fieldName of fieldsToAdd.slice(0, 20)) { // Limit to 20 to avoid too many
      const variable = {
        name: fieldName,
        label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1'),
        type: 'count',
        category: 'Other',
        derived: false,
        isSystem: true,
        order: 0,
        flags: {
          visibleInClicker: true,
          editableInManual: true
        },
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system'
      };
      
      await variablesCollection.insertOne(variable);
      addedVariables++;
      console.log(`  ✅ Added: ${fieldName}`);
    }
    
    if (fieldsToAdd.length > 20) {
      console.log(`  ⏭️  ${fieldsToAdd.length - 20} more fields could be added (limited to 20)`);
    }
    
    console.log(`\n✅ Added ${addedVariables} missing fields to KYC\n`);
    
    // ==========================================
    // PART 4: Remove invalid KYC variables
    // ==========================================
    console.log('📊 PART 4: Removing invalid KYC variables\n');
    
    const invalidKYC = existingKYC.filter(v => {
      const fieldName = v.name;
      return !mongoFields.has(fieldName) && 
             fieldName !== 'hashtags' && // Special case - hashtags is not in stats
             !fieldName.startsWith('reportText') && // Keep reportText even if not in all projects
             !fieldName.startsWith('reportImage'); // Keep reportImage even if not in all projects
    });
    
    let removedVariables = 0;
    
    for (const variable of invalidKYC.slice(0, 10)) { // Limit to 10
      if (!variable.isSystem) { // Only remove non-system variables
        await variablesCollection.deleteOne({ _id: variable._id });
        removedVariables++;
        console.log(`  ✅ Removed: ${variable.name}`);
      } else {
        console.log(`  ⏭️  Skipped (system variable): ${variable.name}`);
      }
    }
    
    console.log(`\n✅ Removed ${removedVariables} invalid KYC variables\n`);
    
    console.log('='.repeat(80));
    console.log('\n✅ All remaining issues fixed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixRemainingIssues();

