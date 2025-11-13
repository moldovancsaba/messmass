// WHAT: Root Cause Analysis - Diagnose data structure inconsistencies
// WHY: Identify why BuilderMode and stats pages have different expectations
// HOW: Check MongoDB structure vs TypeScript interfaces vs component expectations

import { getDb } from '../lib/db';

async function analyzeDataStructures() {
  console.log('🔍 ROOT CAUSE ANALYSIS\n');
  console.log('=' .repeat(80));
  
  const db = await getDb();
  
  // 1. Check report_templates collection structure
  console.log('\n📋 REPORT TEMPLATES COLLECTION');
  console.log('-'.repeat(80));
  const template = await db.collection('report_templates').findOne({ name: /AS ROMA/i });
  if (template) {
    console.log('Template name:', template.name);
    console.log('dataBlocks count:', template.dataBlocks?.length || 0);
    console.log('dataBlocks[0] structure:', JSON.stringify(template.dataBlocks?.[0], null, 2));
    console.log('dataBlocks[0] keys:', Object.keys(template.dataBlocks?.[0] || {}));
  }
  
  // 2. Check data_blocks collection structure
  console.log('\n📊 DATA_BLOCKS COLLECTION');
  console.log('-'.repeat(80));
  const block = await db.collection('data_blocks').findOne({});
  if (block) {
    console.log('Block name:', block.name);
    console.log('Block _id:', block._id);
    console.log('Block keys:', Object.keys(block));
    console.log('Block.charts structure:', JSON.stringify(block.charts, null, 2));
    console.log('Block.charts[0] keys:', Object.keys(block.charts?.[0] || {}));
  }
  
  // 3. Check what API returns
  console.log('\n🌐 API EXPECTATIONS');
  console.log('-'.repeat(80));
  console.log('report-config API populateDataBlocks() returns:');
  console.log('  {');
  console.log('    _id: block._id.toString(),');
  console.log('    name: block.name,');
  console.log('    showTitle: block.showTitle ?? true,');
  console.log('    order: ref.order,');
  console.log('    isActive: block.isActive ?? true,');
  console.log('    charts: block.charts || []  // <-- Full charts array');
  console.log('  }');
  
  // 4. Check component expectations
  console.log('\n⚛️  COMPONENT EXPECTATIONS');
  console.log('-'.repeat(80));
  console.log('BuilderMode expects:');
  console.log('  interface DataBlock {');
  console.log('    _id: string;');
  console.log('    name: string;');
  console.log('    showTitle?: boolean;');
  console.log('    order: number;');
  console.log('    isActive: boolean;');
  console.log('    charts: Array<{chartId, width, order}>;  // <-- Uses block.charts[0]');
  console.log('  }');
  
  console.log('\nUnifiedDataVisualization expects:');
  console.log('  interface DataVisualizationBlock {');
  console.log('    _id?: string;');
  console.log('    name: string;');
  console.log('    charts: BlockChart[];  // <-- Iterates all charts');
  console.log('    order: number;');
  console.log('    isActive: boolean;');
  console.log('    showTitle?: boolean;');
  console.log('  }');
  
  // 5. Analyze the mismatch
  console.log('\n⚠️  PROBLEM ANALYSIS');
  console.log('-'.repeat(80));
  console.log('Issue: Template dataBlocks stored as REFERENCES (blockId + order + overrides)');
  console.log('       but components expect FULL BLOCKS (with charts array)');
  console.log('');
  console.log('Current Flow:');
  console.log('  1. Template has: { blockId: "xxx", order: 1, overrides: {} }');
  console.log('  2. API fetches blocks: db.collection("data_blocks").find({ _id: {$in: blockIds} })');
  console.log('  3. API returns: Full blocks with charts array');
  console.log('  4. Components use: blocks.charts array');
  console.log('');
  console.log('✅ This is CORRECT! Templates should store references, API hydrates.');
  
  // 6. Check for actual data issues
  console.log('\n🔍 CHECKING FOR DATA CORRUPTION');
  console.log('-'.repeat(80));
  
  if (template && template.dataBlocks) {
    for (let i = 0; i < Math.min(3, template.dataBlocks.length); i++) {
      const ref = template.dataBlocks[i];
      console.log(`\nBlock ${i + 1}:`);
      console.log('  blockId:', ref.blockId);
      console.log('  order:', ref.order);
      
      // Fetch the actual block
      const actualBlock = await db.collection('data_blocks').findOne({ 
        _id: ref.blockId 
      });
      
      if (actualBlock) {
        console.log('  ✅ Block exists in data_blocks');
        console.log('  Block name:', actualBlock.name);
        console.log('  Charts count:', actualBlock.charts?.length || 0);
        if (actualBlock.charts && actualBlock.charts.length > 0) {
          console.log('  First chart:', actualBlock.charts[0].chartId);
        }
      } else {
        console.log('  ❌ Block NOT FOUND in data_blocks!');
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Analysis complete');
  process.exit(0);
}

analyzeDataStructures().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
