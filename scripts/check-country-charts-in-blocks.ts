import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkCountryChartsInBlocks() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Get country chart IDs
    const countryCharts = await db.collection('chartConfigurations').find({
      chartId: { $in: ['bitly-top-countries', 'bitly-top-country', 'bitly-countries-reached'] }
    }).toArray();
    
    console.log('🔍 Checking country charts in data blocks...\n');
    
    for (const chart of countryCharts) {
      console.log(`📊 Chart: ${chart.chartId} (_id: ${chart._id})`);
      
      // Find data blocks that contain this chart
      const blocks = await db.collection('dataBlocks').find({
        'charts.chartId': chart._id.toString()
      }).toArray();
      
      if (blocks.length > 0) {
        console.log(`   ✅ Found in ${blocks.length} data block(s):`);
        blocks.forEach(block => {
          console.log(`      - Block: "${block.name}" (isActive: ${block.isActive})`);
        });
      } else {
        console.log(`   ❌ NOT FOUND in any data blocks`);
      }
      console.log('');
    }
    
    // Show all data blocks
    console.log('\n📦 All data blocks:');
    const allBlocks = await db.collection('dataBlocks').find({ isActive: true }).toArray();
    allBlocks.forEach(block => {
      console.log(`\n  Block: "${block.name}" (${block.charts?.length || 0} charts)`);
      block.charts?.forEach((chart: any, idx: number) => {
        console.log(`    ${idx + 1}. ${chart.chartId}`);
      });
    });
    
  } finally {
    await client.close();
  }
}

checkCountryChartsInBlocks();
