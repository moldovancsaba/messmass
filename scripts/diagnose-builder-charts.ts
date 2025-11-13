// WHAT: Diagnostic script to find template/chart mismatches
// WHY: Builder Mode shows "Chart not found" - need to identify which charts are missing
// HOW: Compare chart IDs in templates vs chart_configurations collection

import { getDb } from '../lib/db';

async function diagnoseBuilderCharts() {
  try {
    console.log('🔍 Diagnosing Builder Mode chart issues...\n');
    
    const db = await getDb();
    
    // 1. Get all chart configurations
    const chartConfigs = await db.collection('chart_configurations').find({}).toArray();
    const chartIds = new Set(chartConfigs.map(c => c.chartId));
    console.log(`✅ Found ${chartIds.size} chart configurations:`);
    Array.from(chartIds).forEach(id => console.log(`   - ${id}`));
    console.log('');
    
    // 2. Get default template
    const defaultTemplate = await db.collection('report_templates').findOne({ isDefault: true });
    if (defaultTemplate) {
      console.log(`📋 Default template: "${defaultTemplate.name}"`);
      console.log(`   Type: ${defaultTemplate.type}`);
      console.log(`   Blocks: ${defaultTemplate.dataBlocks?.length || 0}`);
      
      if (defaultTemplate.dataBlocks && defaultTemplate.dataBlocks.length > 0) {
        // Get actual block documents
        const blockIds = defaultTemplate.dataBlocks.map((ref: any) => ref.blockId);
        const blocks = await db.collection('data_blocks').find({
          _id: { $in: blockIds }
        }).toArray();
        
        console.log(`\n   Block details:`);
        blocks.forEach((block: any) => {
          console.log(`   - Block: ${block.name}`);
          block.charts?.forEach((chart: any) => {
            const exists = chartIds.has(chart.chartId);
            const status = exists ? '✅' : '❌';
            console.log(`     ${status} Chart: ${chart.chartId}`);
          });
        });
      }
    } else {
      console.log('⚠️  No default template found in database');
    }
    
    console.log('');
    
    // 3. Get partner templates
    const partnerTemplates = await db.collection('report_templates').find({ type: 'partner' }).toArray();
    console.log(`\n📊 Partner templates: ${partnerTemplates.length}`);
    
    for (const template of partnerTemplates) {
      console.log(`\n   Template: "${template.name}"`);
      console.log(`   Blocks: ${template.dataBlocks?.length || 0}`);
      
      if (template.dataBlocks && template.dataBlocks.length > 0) {
        const blockIds = template.dataBlocks.map((ref: any) => ref.blockId);
        const blocks = await db.collection('data_blocks').find({
          _id: { $in: blockIds }
        }).toArray();
        
        blocks.forEach((block: any) => {
          console.log(`   - Block: ${block.name}`);
          block.charts?.forEach((chart: any) => {
            const exists = chartIds.has(chart.chartId);
            const status = exists ? '✅' : '❌';
            console.log(`     ${status} Chart: ${chart.chartId}`);
          });
        });
      }
    }
    
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseBuilderCharts();
