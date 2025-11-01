const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function checkChart() {
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('🔍 Checking marketing-value chart configuration...\n');
    const chartConfig = await db.collection('chartConfigurations').findOne({ chartId: 'marketing-value' });
    
    if (!chartConfig) {
      console.log('❌ Chart configuration NOT FOUND');
      return;
    }
    
    console.log('✅ Chart configuration found:');
    console.log('  - chartId:', chartConfig.chartId);
    console.log('  - title:', chartConfig.title);
    console.log('  - type:', chartConfig.type);
    console.log('  - isActive:', chartConfig.isActive);
    console.log('  - elements:', chartConfig.elements?.length || 0);
    console.log('  - order:', chartConfig.order);
    
    console.log('\n🔍 Checking Overview data block...\n');
    const overviewBlock = await db.collection('dataBlocks').findOne({ blockId: 'overview' });
    
    if (!overviewBlock) {
      console.log('❌ Overview data block NOT FOUND');
      return;
    }
    
    console.log('✅ Overview block found:');
    console.log('  - blockId:', overviewBlock.blockId);
    console.log('  - title:', overviewBlock.title);
    console.log('  - order:', overviewBlock.order);
    console.log('  - columns:', overviewBlock.columns);
    console.log('  - isActive:', overviewBlock.isActive);
    console.log('  - charts:', overviewBlock.charts?.length || 0);
    
    if (overviewBlock.charts && overviewBlock.charts.length > 0) {
      console.log('\n📊 Charts in Overview block:');
      overviewBlock.charts.forEach(chart => {
        console.log(`  - ${chart.chartId} (order: ${chart.order}, width: ${chart.width})`);
      });
      
      const hasMarketingValue = overviewBlock.charts.some(c => c.chartId === 'marketing-value');
      console.log(`\n${hasMarketingValue ? '✅' : '❌'} marketing-value ${hasMarketingValue ? 'IS' : 'is NOT'} in Overview block`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkChart();
