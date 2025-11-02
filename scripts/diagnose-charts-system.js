#!/usr/bin/env node
// Diagnostic script to check complete chart system state
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function diagnose() {
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('='.repeat(80));
    console.log('MESSMASS CHART SYSTEM DIAGNOSTIC');
    console.log('='.repeat(80));
    console.log('');
    
    // 1. Check chartConfigurations collection
    console.log('1. CHART CONFIGURATIONS (chartConfigurations collection)');
    console.log('-'.repeat(80));
    const charts = await db.collection('chart_configurations').find({}).toArray();
    console.log(`Total charts: ${charts.length}`);
    console.log('');
    
    if (charts.length > 0) {
      console.log('Charts by type:');
      const byType = {};
      charts.forEach(c => {
        byType[c.type] = (byType[c.type] || 0) + 1;
      });
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
      console.log('');
      
      console.log('Active vs Inactive:');
      const active = charts.filter(c => c.isActive).length;
      const inactive = charts.length - active;
      console.log(`  - Active: ${active}`);
      console.log(`  - Inactive: ${inactive}`);
      console.log('');
      
      console.log('Sample charts (first 10):');
      charts.slice(0, 10).forEach(c => {
        console.log(`  - ${c.chartId} (${c.title}) [${c.type}] ${c.isActive ? '✓' : '✗'}`);
      });
    } else {
      console.log('❌ NO CHARTS FOUND IN DATABASE!');
      console.log('   This means no charts have been created in Chart Algorithm Manager.');
    }
    console.log('');
    console.log('');
    
    // 2. Check dataBlocks collection
    console.log('2. DATA BLOCKS (dataBlocks collection)');
    console.log('-'.repeat(80));
    const blocks = await db.collection('data_blocks').find({}).toArray();
    console.log(`Total data blocks: ${blocks.length}`);
    console.log('');
    
    if (blocks.length > 0) {
      blocks.forEach(block => {
        console.log(`Block: "${block.name || block.blockId}"`);
        console.log(`  - Order: ${block.order}`);
        console.log(`  - Active: ${block.isActive ? '✓' : '✗'}`);
        console.log(`  - Charts: ${block.charts?.length || 0}`);
        
        if (block.charts && block.charts.length > 0) {
          block.charts.forEach(chart => {
            const chartConfig = charts.find(c => c.chartId === chart.chartId);
            const status = chartConfig ? '✓ EXISTS' : '✗ MISSING';
            console.log(`    - ${chart.chartId} (order: ${chart.order}, width: ${chart.width}) ${status}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ NO DATA BLOCKS FOUND IN DATABASE!');
      console.log('   This means no blocks have been created in Visualization Manager.');
    }
    console.log('');
    console.log('');
    
    // 3. Check for orphaned charts in blocks
    console.log('3. ORPHANED CHARTS IN BLOCKS');
    console.log('-'.repeat(80));
    const chartIds = new Set(charts.map(c => c.chartId));
    let orphanCount = 0;
    
    blocks.forEach(block => {
      if (block.charts && block.charts.length > 0) {
        block.charts.forEach(chart => {
          if (!chartIds.has(chart.chartId)) {
            orphanCount++;
            console.log(`❌ Block "${block.name}" references non-existent chart: ${chart.chartId}`);
          }
        });
      }
    });
    
    if (orphanCount === 0) {
      console.log('✅ No orphaned charts found. All block references are valid.');
    } else {
      console.log('');
      console.log(`⚠️  Found ${orphanCount} orphaned chart references.`);
      console.log('   Fix: Remove these charts from blocks or create the missing chart configurations.');
    }
    console.log('');
    console.log('');
    
    // 4. Check for unused charts
    console.log('4. UNUSED CHARTS');
    console.log('-'.repeat(80));
    const usedChartIds = new Set();
    blocks.forEach(block => {
      if (block.charts && block.charts.length > 0) {
        block.charts.forEach(chart => usedChartIds.add(chart.chartId));
      }
    });
    
    const unusedCharts = charts.filter(c => !usedChartIds.has(c.chartId));
    
    if (unusedCharts.length > 0) {
      console.log(`Found ${unusedCharts.length} charts not assigned to any block:`);
      unusedCharts.slice(0, 20).forEach(c => {
        console.log(`  - ${c.chartId} (${c.title})`);
      });
      if (unusedCharts.length > 20) {
        console.log(`  ... and ${unusedCharts.length - 20} more`);
      }
    } else {
      console.log('✅ All charts are assigned to at least one block.');
    }
    console.log('');
    console.log('');
    
    // 5. Summary and recommendations
    console.log('5. SUMMARY & RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    if (charts.length === 0) {
      console.log('❌ CRITICAL: No charts in database!');
      console.log('   Action: Go to /admin/charts and create chart configurations.');
      console.log('');
    }
    
    if (blocks.length === 0) {
      console.log('❌ CRITICAL: No data blocks in database!');
      console.log('   Action: Go to /admin/visualization and create data blocks.');
      console.log('');
    }
    
    if (orphanCount > 0) {
      console.log('⚠️  WARNING: Orphaned chart references found!');
      console.log('   Action: Remove invalid chart references from blocks or create missing charts.');
      console.log('');
    }
    
    if (charts.length > 0 && blocks.length > 0 && orphanCount === 0) {
      console.log('✅ Chart system looks healthy!');
      console.log(`   - ${charts.length} charts configured`);
      console.log(`   - ${blocks.length} data blocks configured`);
      console.log(`   - All references are valid`);
      console.log('');
      console.log('Next: Check stats page to see if charts are rendering correctly.');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('END OF DIAGNOSTIC');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

diagnose();
