// WHAT: Check which chart configurations are missing title field
// WHY: JavaScript error "e.title.includes is not a function" indicates undefined title
// HOW: Query all charts and filter for missing title field

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

async function checkChartTitles() {
  // WHAT: Non-null assertion because we exit above if uri is undefined
  // WHY: TypeScript doesn't know process.exit() prevents execution flow
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('messmass');
    const chartsCollection = db.collection('chart_configurations');
    
    // Fetch all charts
    const allCharts = await chartsCollection.find({}, { 
      projection: { chartId: 1, title: 1, type: 1, icon: 1 } 
    }).toArray();
    
    console.log(`\n📊 Total charts in database: ${allCharts.length}`);
    
    // Filter charts without title
    const withoutTitle = allCharts.filter(c => !c.title || c.title === '');
    
    console.log(`❌ Charts WITHOUT title field: ${withoutTitle.length}`);
    
    if (withoutTitle.length > 0) {
      console.log('\n🔍 Charts missing title:\n');
      withoutTitle.forEach((c, index) => {
        console.log(`${index + 1}. chartId: "${c.chartId}"`);
        console.log(`   type: ${c.type || 'N/A'}`);
        console.log(`   icon: ${c.icon || 'N/A'}`);
        console.log(`   _id: ${c._id}`);
        console.log('');
      });
      
      console.log('\n💡 Fix: Update these charts to have title field');
      console.log('   Option 1: Run update script to auto-generate titles');
      console.log('   Option 2: Add null checks in visualization/page.tsx lines 1015-1024');
    } else {
      console.log('✅ All charts have title field');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

checkChartTitles();
