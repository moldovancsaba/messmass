#!/usr/bin/env node

/**
 * Remove all VALUE chart system from database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { MongoClient } = require('mongodb');

async function removeValueCharts() {
  console.log('\n🗑️  Removing VALUE chart system from database...\n');
  
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('messmass');
  
  // 1. Remove VALUE chart configurations
  console.log('1. Removing VALUE chart configurations...');
  const chartResult = await db.collection('chart_configurations').deleteMany({
    type: 'value'
  });
  console.log(`   ✅ Deleted ${chartResult.deletedCount} VALUE chart configurations`);
  
  // 2. Remove orphaned split charts (-kpi, -bar from VALUE charts)
  console.log('\n2. Removing orphaned VALUE split charts...');
  const splitResult = await db.collection('chart_configurations').deleteMany({
    chartId: { $regex: /^(value|estimated-value|marketing-value).*(-kpi|-bar)$/ }
  });
  console.log(`   ✅ Deleted ${splitResult.deletedCount} split chart configurations`);
  
  // 3. Remove VALUE charts from dataBlocks
  console.log('\n3. Removing VALUE charts from visualization blocks...');
  const blocks = await db.collection('data_blocks').find({}).toArray();
  let blocksUpdated = 0;
  
  for (const block of blocks) {
    const originalCount = block.charts?.length || 0;
    const filtered = block.charts?.filter(c => {
      const isValue = c.chartId.match(/^(value|estimated-value|marketing-value)/);
      return !isValue;
    }) || [];
    
    if (filtered.length !== originalCount) {
      await db.collection('data_blocks').updateOne(
        { _id: block._id },
        { $set: { charts: filtered } }
      );
      console.log(`   ✅ Updated "${block.name}" - removed ${originalCount - filtered.length} VALUE charts`);
      blocksUpdated++;
    }
  }
  
  console.log(`   ✅ Updated ${blocksUpdated} blocks`);
  
  console.log('\n✅ VALUE chart system removed from database\n');
  
  await client.close();
}

removeValueCharts().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
