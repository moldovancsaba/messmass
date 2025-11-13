// WHAT: Fix data_blocks referencing non-existent chart IDs (fanSelfie*)
// WHY: BuilderMode shows "Chart not found" because blocks reference charts that don't exist
// HOW: Update blocks to use existing report-image-* and report-text-* charts OR create missing charts

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixDataBlockChartRefs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // Get all chart configurations
    const charts = await db.collection('chart_configurations').find({}).toArray();
    const validChartIds = new Set(charts.map(c => c.chartId));
    
    console.log(`\n📊 Found ${validChartIds.size} valid chart configurations`);
    console.log('Valid chart IDs (first 20):', Array.from(validChartIds).sort().slice(0, 20).join(', '));
    
    // Find all data_blocks with invalid chart references
    const blocks = await db.collection('data_blocks').find({}).toArray();
    console.log(`\n📦 Checking ${blocks.length} data blocks...`);
    
    let blocksWithInvalidRefs = 0;
    let totalInvalidRefs = 0;
    
    for (const block of blocks) {
      const invalidCharts = (block.charts || []).filter((c: any) => !validChartIds.has(c.chartId));
      
      if (invalidCharts.length > 0) {
        blocksWithInvalidRefs++;
        totalInvalidRefs += invalidCharts.length;
        
        console.log(`\n❌ Block: ${block.name} (${block._id})`);
        console.log(`   Invalid chart refs: ${invalidCharts.map((c: any) => c.chartId).join(', ')}`);
        
        // For now, just report - don't auto-fix without user confirmation
      }
    }
    
    if (blocksWithInvalidRefs === 0) {
      console.log('\n✅ All data blocks reference valid charts!');
    } else {
      console.log(`\n\n${'='.repeat(80)}`);
      console.log('🔍 SUMMARY');
      console.log('='.repeat(80));
      console.log(`Found ${blocksWithInvalidRefs} blocks with ${totalInvalidRefs} invalid chart references`);
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('1. Create missing chart algorithms for fanSelfie* variables, OR');
      console.log('2. Update data_blocks to reference existing report-image-*/report-text-* charts, OR');
      console.log('3. Delete invalid chart references from blocks');
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

fixDataBlockChartRefs()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Check failed:', err);
    process.exit(1);
  });
