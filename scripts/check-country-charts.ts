import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkCountryCharts() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const countryChartIds = [
      'bitly-top-countries',
      'bitly-top-country', 
      'bitly-countries-reached'
    ];
    
    console.log('🔍 Checking country-related charts...\n');
    
    for (const chartId of countryChartIds) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      if (chart) {
        console.log(`✅ ${chartId}: EXISTS (isActive: ${chart.isActive})`);
        console.log(`   Formula: ${chart.elements?.[0]?.formula}`);
        console.log(`   Elements: ${chart.elements?.length}`);
      } else {
        console.log(`❌ ${chartId}: MISSING`);
      }
      console.log('');
    }
    
    // Check if variables exist
    console.log('\n🔍 Checking Bitly country variables...\n');
    const variables = await db.collection('variables_metadata').find({
      name: { $regex: /bitly.*country/i }
    }).toArray();
    
    console.log(`Found ${variables.length} Bitly country variables:`);
    variables.forEach(v => {
      console.log(`  - ${v.name}`);
    });
    
  } finally {
    await client.close();
  }
}

checkCountryCharts();
