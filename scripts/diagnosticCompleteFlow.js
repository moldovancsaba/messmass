// scripts/diagnosticCompleteFlow.js
// WHAT: Complete diagnostic audit of KYC Variables → Charts → Visualization → Stats page flow
// WHY: Identify where newly created "marketing-value" chart is breaking
// HOW: Step-by-step MongoDB queries + API simulation

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

console.log('🔍 COMPLETE FLOW DIAGNOSTIC');
console.log('='.repeat(80));
console.log(`📊 Database: ${MONGODB_DB}`);
console.log(`🔗 URI: ${MONGODB_URI?.substring(0, 50)}...`);
console.log('='.repeat(80));

async function runDiagnostic() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // ========================================================================
    // STEP 1: KYC VARIABLES - How variables are stored and accessed
    // ========================================================================
    console.log('='.repeat(80));
    console.log('📊 STEP 1: KYC VARIABLES SYSTEM');
    console.log('='.repeat(80));
    
    const variablesCol = db.collection('variables_metadata');
    const variablesCount = await variablesCol.countDocuments();
    console.log(`\n📈 Total variables in variables_metadata: ${variablesCount}`);
    
    // Check variable structure
    const sampleVariable = await variablesCol.findOne({});
    console.log('\n🔍 Sample Variable Structure:');
    console.log(JSON.stringify(sampleVariable, null, 2));
    
    // Check for specific variables that might be used in marketing-value chart
    const marketingVars = await variablesCol.find({
      $or: [
        { name: /market/i },
        { name: /value/i },
        { name: /email/i },
        { name: /social/i }
      ]
    }).toArray();
    
    console.log(`\n📝 Variables related to "marketing/value":`);
    marketingVars.forEach(v => {
      console.log(`  - name: ${v.name}, label: ${v.label}, type: ${v.type}, category: ${v.category}`);
    });
    
    // ========================================================================
    // STEP 2: CHART CONFIGURATIONS - How charts are stored
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 STEP 2: CHART CONFIGURATIONS SYSTEM');
    console.log('='.repeat(80));
    
    const chartsCol = db.collection('chart_configurations');
    const chartsCount = await chartsCol.countDocuments();
    console.log(`\n📈 Total charts in chartConfigurations: ${chartsCount}`);
    
    // Check for "marketing-value" chart
    const marketingChart = await chartsCol.findOne({ chartId: 'marketing-value' });
    
    if (marketingChart) {
      console.log('\n✅ "marketing-value" chart EXISTS in database!');
      console.log('🔍 Chart Structure:');
      console.log(JSON.stringify(marketingChart, null, 2));
      
      // Validate elements structure
      console.log('\n🔍 Elements Validation:');
      marketingChart.elements?.forEach((el, idx) => {
        console.log(`  Element ${idx + 1}:`);
        console.log(`    - label: ${el.label}`);
        console.log(`    - formula: ${el.formula}`);
        console.log(`    - color: ${el.color}`);
        console.log(`    - formatting: ${JSON.stringify(el.formatting)}`);
      });
    } else {
      console.log('\n❌ "marketing-value" chart NOT FOUND in chartConfigurations!');
      console.log('⚠️  This means the chart was never saved or was deleted.');
    }
    
    // List all chart IDs for reference
    const allCharts = await chartsCol.find({}).project({ chartId: 1, title: 1, type: 1, isActive: 1 }).toArray();
    console.log(`\n📋 All existing charts (${allCharts.length}):`);
    allCharts.forEach(c => {
      console.log(`  - ${c.chartId} | ${c.title} | ${c.type} | ${c.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    // ========================================================================
    // STEP 3: DATA VISUALIZATION BLOCKS - How charts are assigned to blocks
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 STEP 3: DATA VISUALIZATION BLOCKS');
    console.log('='.repeat(80));
    
    const blocksCol = db.collection('data_blocks');
    const blocksCount = await blocksCol.countDocuments();
    console.log(`\n📈 Total blocks in dataBlocks: ${blocksCount}`);
    
    const allBlocks = await blocksCol.find({}).toArray();
    console.log(`\n📋 All blocks:`);
    allBlocks.forEach(block => {
      console.log(`\n  Block: ${block.blockId} (${block.title})`);
      console.log(`    - isActive: ${block.isActive}`);
      console.log(`    - order: ${block.order}`);
      console.log(`    - charts count: ${block.charts?.length || 0}`);
      if (block.charts && block.charts.length > 0) {
        console.log(`    - charts: ${block.charts.join(', ')}`);
        
        // Check if marketing-value is in this block
        if (block.charts.includes('marketing-value')) {
          console.log(`      ✅ "marketing-value" IS in this block!`);
        }
      }
    });
    
    // ========================================================================
    // STEP 4: CHART RESULTS SIMULATION - How charts are calculated
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 STEP 4: CHART CALCULATION SIMULATION');
    console.log('='.repeat(80));
    
    // Get a sample project to test chart calculation
    const projectsCol = db.collection('projects');
    const sampleProject = await projectsCol.findOne({});
    
    if (sampleProject) {
      console.log(`\n🎯 Testing with sample project: ${sampleProject.eventName}`);
      console.log(`📊 Project stats keys: ${Object.keys(sampleProject.stats || {}).join(', ')}`);
      
      // If marketing-value chart exists, try to calculate it
      if (marketingChart) {
        console.log('\n🧮 Attempting to calculate "marketing-value" chart:');
        
        marketingChart.elements?.forEach((el, idx) => {
          console.log(`\n  Element ${idx + 1}: ${el.label}`);
          console.log(`    Formula: ${el.formula}`);
          
          // Extract variables from formula
          const variablePattern = /\[([a-zA-Z0-9_.]+)\]/g;
          const matches = el.formula.matchAll(variablePattern);
          const usedVars = Array.from(matches, m => m[1]);
          
          console.log(`    Variables used: ${usedVars.join(', ')}`);
          
          // Check if variables exist in project stats
          usedVars.forEach(varName => {
            const cleanName = varName.replace('stats.', '');
            const exists = sampleProject.stats && (cleanName in sampleProject.stats);
            const value = exists ? sampleProject.stats[cleanName] : 'NOT FOUND';
            console.log(`      - ${varName}: ${exists ? '✅' : '❌'} = ${value}`);
          });
        });
      }
    } else {
      console.log('\n⚠️  No sample project found to test chart calculation');
    }
    
    // ========================================================================
    // STEP 5: STATS PAGE DATA FLOW - How data reaches the frontend
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 STEP 5: STATS PAGE DATA FLOW');
    console.log('='.repeat(80));
    
    console.log('\n📝 Stats page flow:');
    console.log('  1. /api/page-config → Fetches data blocks');
    console.log('  2. /api/chart-config/public → Fetches chart configurations');
    console.log('  3. /api/chart-results → Calculates chart values from project stats');
    console.log('  4. UnifiedDataVisualization.tsx → Renders charts by matching chartId');
    
    // Check if chart-config/public endpoint would return marketing-value
    if (marketingChart && marketingChart.isActive) {
      console.log('\n  ✅ marketing-value chart is ACTIVE and would be returned by /api/chart-config/public');
    } else if (marketingChart) {
      console.log('\n  ⚠️  marketing-value chart exists but is INACTIVE');
    } else {
      console.log('\n  ❌ marketing-value chart does NOT exist in database');
    }
    
    // Check if any block includes marketing-value
    const blockWithMarketingValue = allBlocks.find(b => b.charts?.includes('marketing-value'));
    if (blockWithMarketingValue) {
      console.log(`  ✅ marketing-value is assigned to block: ${blockWithMarketingValue.blockId}`);
    } else {
      console.log('  ❌ marketing-value is NOT assigned to any block');
    }
    
    // ========================================================================
    // STEP 6: DIAGNOSTIC SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80));
    
    const issues = [];
    const checks = [];
    
    // Check 1: Variables system
    if (variablesCount > 0) {
      checks.push('✅ Variables metadata collection exists');
    } else {
      issues.push('❌ Variables metadata collection is EMPTY');
    }
    
    // Check 2: Chart exists
    if (marketingChart) {
      checks.push('✅ "marketing-value" chart exists in database');
      
      // Check 2a: Chart is active
      if (marketingChart.isActive) {
        checks.push('✅ "marketing-value" chart is ACTIVE');
      } else {
        issues.push('❌ "marketing-value" chart is INACTIVE');
      }
      
      // Check 2b: Chart has valid elements
      if (marketingChart.elements && marketingChart.elements.length > 0) {
        checks.push(`✅ "marketing-value" chart has ${marketingChart.elements.length} elements`);
      } else {
        issues.push('❌ "marketing-value" chart has NO elements');
      }
    } else {
      issues.push('❌ "marketing-value" chart does NOT exist in database');
    }
    
    // Check 3: Block assignment
    if (blockWithMarketingValue) {
      checks.push(`✅ "marketing-value" is assigned to block: ${blockWithMarketingValue.blockId}`);
    } else {
      issues.push('❌ "marketing-value" is NOT assigned to any data block');
    }
    
    console.log('\n✅ PASSING CHECKS:');
    checks.forEach(c => console.log(`  ${c}`));
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(i => console.log(`  ${i}`));
    } else {
      console.log('\n🎉 NO ISSUES FOUND - Chart should be visible!');
    }
    
    // ========================================================================
    // STEP 7: RECOMMENDED ACTIONS
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 RECOMMENDED ACTIONS');
    console.log('='.repeat(80));
    
    if (!marketingChart) {
      console.log('\n1. ⚠️  Create the "marketing-value" chart in Chart Algorithm Manager');
      console.log('   - Go to /admin/charts');
      console.log('   - Click "New Chart"');
      console.log('   - Fill in chartId: "marketing-value"');
      console.log('   - Save the chart');
    }
    
    if (marketingChart && !marketingChart.isActive) {
      console.log('\n2. ⚠️  Activate the "marketing-value" chart');
      console.log('   - Go to /admin/charts');
      console.log('   - Find "marketing-value" chart');
      console.log('   - Click status toggle to make it ACTIVE');
    }
    
    if (!blockWithMarketingValue) {
      console.log('\n3. ⚠️  Assign "marketing-value" to a data block');
      console.log('   - Go to /admin/visualization');
      console.log('   - Edit a block (e.g., Overview)');
      console.log('   - Add "marketing-value" to the block\'s charts array');
      console.log('   - Save the block');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await client.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

runDiagnostic();
