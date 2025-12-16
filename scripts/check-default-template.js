// Check what the default event template uses
// Run with: node scripts/check-default-template.js

const { MongoClient, ObjectId } = require('mongodb');

async function checkDefaultTemplate() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Checking default event template...\n');
    
    // Find default event template
    const defaultTemplate = await db.collection('report_templates').findOne({ 
      type: 'event',
      isDefault: true 
    });
    
    if (!defaultTemplate) {
      console.error('❌ No default event template found');
      return;
    }
    
    console.log('✅ Default template:', defaultTemplate.name);
    console.log('✅ Data blocks:', defaultTemplate.dataBlocks?.length || 0);
    
    if (defaultTemplate.dataBlocks && defaultTemplate.dataBlocks.length > 0) {
      console.log('\nData blocks:');
      
      for (const blockRef of defaultTemplate.dataBlocks) {
        const block = await db.collection('data_blocks').findOne({ _id: new ObjectId(blockRef.blockId) });
        if (block) {
          console.log(`\n  Block: ${block.name} (active: ${block.isActive})`);
          console.log(`  Charts: ${block.charts?.length || 0}`);
          
          if (block.charts && block.charts.length > 0) {
            for (const chart of block.charts) {
              // Check if chart configuration exists
              const chartConfig = await db.collection('chart_configurations').findOne({ 
                chartId: chart.chartId 
              });
              
              console.log(`    Chart: ${chart.chartId} (width: ${chart.width}) ${chartConfig ? '✅' : '❌'}`);
              if (chartConfig) {
                console.log(`      Title: ${chartConfig.title}`);
                console.log(`      Type: ${chartConfig.type}`);
                console.log(`      Active: ${chartConfig.isActive}`);
              }
            }
          }
        }
      }
    }
    
    // Also check what chart configurations actually exist
    console.log('\n📊 Available chart configurations:');
    const allCharts = await db.collection('chart_configurations').find({ 
      isActive: true 
    }).toArray();
    
    console.log(`Found ${allCharts.length} active chart configurations:`);
    allCharts.forEach(chart => {
      console.log(`  ${chart.chartId}: ${chart.title} (${chart.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

checkDefaultTemplate().catch(console.error);