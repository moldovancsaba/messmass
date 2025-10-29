import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBlockStorage() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const block = await db.collection('dataBlocks').findOne({ name: 'Overview' });
    
    if (block) {
      console.log('📦 Overview block charts:\n');
      block.charts?.forEach((chart: any, idx: number) => {
        console.log(`${idx + 1}. chartId: ${chart.chartId} (type: ${typeof chart.chartId})`);
      });
      
      // Get the actual chart configs
      console.log('\n\n🔍 Matching chart configurations:\n');
      const countryCharts = await db.collection('chartConfigurations').find({
        chartId: { $in: ['bitly-top-countries', 'bitly-top-country', 'bitly-countries-reached'] }
      }).toArray();
      
      countryCharts.forEach(chart => {
        console.log(`Chart "${chart.chartId}":`);
        console.log(`  _id: ${chart._id} (type: ${typeof chart._id})`);
        console.log(`  _id.toString(): ${chart._id.toString()}`);
        
        // Check if it's in the block
        const foundInBlock = block.charts?.find((bc: any) => bc.chartId === chart._id.toString());
        if (foundInBlock) {
          console.log(`  ✅ FOUND in block at index ${block.charts.indexOf(foundInBlock)}`);
        } else {
          console.log(`  ❌ NOT FOUND in block`);
        }
        console.log('');
      });
    }
    
  } finally {
    await client.close();
  }
}

checkBlockStorage();
