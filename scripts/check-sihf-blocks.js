require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function checkSihfBlocks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Get SIHF template
    const template = await db.collection('report_templates').findOne({ 
      _id: new ObjectId('693fff05daa7a23d8085643b')
    });
    
    console.log('Template:', template.name);
    console.log('Blocks:', template.dataBlocks?.length || 0);
    
    if (template.dataBlocks) {
      for (let i = 0; i < template.dataBlocks.length; i++) {
        const blockRef = template.dataBlocks[i];
        console.log(`\nBlock ${i + 1}:`);
        console.log('  Block ID:', blockRef.blockId);
        console.log('  Order:', blockRef.order);
        
        // Get actual block
        const blockId = typeof blockRef.blockId === 'string' ? 
          new ObjectId(blockRef.blockId) : blockRef.blockId;
        
        const block = await db.collection('data_blocks').findOne({ _id: blockId });
        
        if (block) {
          console.log('  Block Name:', block.name);
          console.log('  Block Type:', block.type);
          console.log('  Charts:', block.charts?.length || 0);
          
          if (block.charts) {
            for (const chart of block.charts) {
              console.log(`    - ${chart.chartId} (order: ${chart.order})`);
              
              // Check if chart exists and is active
              const chartConfig = await db.collection('chart_configurations').findOne({ 
                chartId: chart.chartId 
              });
              
              if (chartConfig) {
                console.log(`      Status: ${chartConfig.isActive ? 'ACTIVE' : 'INACTIVE'}`);
                console.log(`      Title: ${chartConfig.title}`);
              } else {
                console.log(`      Status: NOT FOUND`);
              }
            }
          }
        } else {
          console.log('  Block NOT FOUND');
        }
      }
    }
    
    // Also check default partner template for comparison
    console.log('\n--- Default Partner Template ---');
    const defaultTemplate = await db.collection('report_templates').findOne({ 
      type: 'partner', 
      isDefault: true 
    });
    
    if (defaultTemplate) {
      console.log('Default template:', defaultTemplate.name);
      console.log('Default blocks:', defaultTemplate.dataBlocks?.length || 0);
    }
    
  } finally {
    await client.close();
  }
}

checkSihfBlocks().catch(console.error);