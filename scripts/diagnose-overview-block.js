#!/usr/bin/env node

/**
 * Diagnostic script to check Overview block chart assignments
 * and fix VALUE chart references
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function diagnoseOverviewBlock() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('messmass');
  
  console.log('\n🔍 Fetching Overview block...\n');
  
  const overviewBlock = await db.collection('visualizationBlocks').findOne({ name: 'Overview' });
  
  if (!overviewBlock) {
    console.log('❌ Overview block not found!');
    await client.close();
    return;
  }
  
  console.log('📋 Overview Block Contents:');
  console.log('Name:', overviewBlock.name);
  console.log('Order:', overviewBlock.order);
  console.log('Is Active:', overviewBlock.isActive);
  console.log('\n📊 Charts in Overview block:');
  
  overviewBlock.charts.forEach((chart, idx) => {
    console.log(`  ${idx + 1}. chartId: "${chart.chartId}"`, {
      sizing: chart.sizing,
      width: chart.width,
      order: chart.order
    });
  });
  
  console.log('\n🔍 Checking chart configurations...\n');
  
  const chartConfigs = await db.collection('chartConfigurations').find({}).toArray();
  const chartIdMap = {};
  chartConfigs.forEach(config => {
    chartIdMap[config.chartId] = {
      title: config.title,
      type: config.type,
      isActive: config.isActive
    };
  });
  
  console.log('📊 Chart details:');
  overviewBlock.charts.forEach((chart, idx) => {
    const config = chartIdMap[chart.chartId];
    if (config) {
      console.log(`  ${idx + 1}. "${chart.chartId}" → ${config.title} (${config.type}, active: ${config.isActive})`);
    } else {
      console.log(`  ${idx + 1}. "${chart.chartId}" → ⚠️ NOT FOUND in chartConfigurations`);
    }
  });
  
  console.log('\n🔍 Checking for VALUE charts with split IDs...\n');
  
  const hasValueChartSplits = overviewBlock.charts.some(chart => 
    chart.chartId.endsWith('-kpi') || chart.chartId.endsWith('-bar')
  );
  
  if (hasValueChartSplits) {
    console.log('⚠️ PROBLEM DETECTED: Block contains split VALUE chart IDs (ending in -kpi or -bar)');
    console.log('VALUE charts should be stored with their BASE ID (without -kpi/-bar suffix)\n');
    
    console.log('🔧 Suggested fixes:');
    overviewBlock.charts.forEach((chart, idx) => {
      if (chart.chartId.endsWith('-kpi')) {
        const baseId = chart.chartId.replace('-kpi', '');
        console.log(`  ${idx + 1}. Replace "${chart.chartId}" with "${baseId}"`);
      } else if (chart.chartId.endsWith('-bar')) {
        const baseId = chart.chartId.replace('-bar', '');
        console.log(`  ${idx + 1}. Replace "${chart.chartId}" with "${baseId}" (or remove if duplicate)`);
      }
    });
    
    console.log('\n❓ Would you like to auto-fix this? (y/n)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        await fixValueChartReferences(db, overviewBlock);
      } else {
        console.log('\n✅ Diagnosis complete. No changes made.');
      }
      await client.close();
      process.exit(0);
    });
  } else {
    console.log('✅ No VALUE chart split IDs detected. Block looks correct.');
    await client.close();
  }
}

async function fixValueChartReferences(db, block) {
  console.log('\n🔧 Fixing VALUE chart references...\n');
  
  const fixedCharts = [];
  const seen = new Set();
  
  block.charts.forEach(chart => {
    let baseId = chart.chartId;
    
    // Remove -kpi or -bar suffix to get base ID
    if (chart.chartId.endsWith('-kpi') || chart.chartId.endsWith('-bar')) {
      baseId = chart.chartId.replace(/-kpi$|-bar$/, '');
    }
    
    // Only add if we haven't seen this base ID
    if (!seen.has(baseId)) {
      seen.add(baseId);
      fixedCharts.push({
        ...chart,
        chartId: baseId
      });
      
      if (baseId !== chart.chartId) {
        console.log(`  ✅ Changed "${chart.chartId}" → "${baseId}"`);
      } else {
        console.log(`  ✓ Kept "${chart.chartId}" (already correct)`);
      }
    } else {
      console.log(`  🗑️ Removed duplicate "${chart.chartId}" (base "${baseId}" already exists)`);
    }
  });
  
  const result = await db.collection('visualizationBlocks').updateOne(
    { _id: block._id },
    { $set: { charts: fixedCharts } }
  );
  
  console.log('\n✅ Update complete:', result.modifiedCount, 'block(s) modified');
  console.log('\n📋 New chart list:');
  fixedCharts.forEach((chart, idx) => {
    console.log(`  ${idx + 1}. "${chart.chartId}"`);
  });
}

diagnoseOverviewBlock().catch(console.error);
