require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function fixSihfChartFormulas() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔧 Fixing SIHF chart formulas...');
    
    // Fix report-image-1: Change from stats.reportImage1 to a working formula
    await db.collection('chart_configurations').updateOne(
      { chartId: 'report-image-1' },
      { 
        $set: { 
          'elements.0.formula': '[MEDIA:sihf-logo]',
          'elements.0.label': 'SIHF Logo',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Fixed report-image-1 formula');
    
    // Fix report-image-2: Change from stats.reportImage2 to a working formula  
    await db.collection('chart_configurations').updateOne(
      { chartId: 'report-image-2' },
      { 
        $set: { 
          'elements.0.formula': '[MEDIA:sihf-banner]',
          'elements.0.label': 'SIHF Banner',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Fixed report-image-2 formula');
    
    // Fix unique-users: Change from stats.uniqueUsers to total fans calculation
    await db.collection('chart_configurations').updateOne(
      { chartId: 'unique-users' },
      { 
        $set: { 
          'elements.0.formula': '[remoteFans] + [stadium]',
          'elements.0.label': 'Total Fans',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Fixed unique-users formula');
    
    // Fix total-fans-engaged: Change from stats.totalFans to correct calculation
    await db.collection('chart_configurations').updateOne(
      { chartId: 'total-fans-engaged' },
      { 
        $set: { 
          'elements.0.formula': '[remoteImages] + [hostessImages] + [selfies]',
          'elements.0.label': 'Total Images',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Fixed total-fans-engaged formula');
    
    // Fix engagement-rate: Change to a safe calculation without division by zero
    await db.collection('chart_configurations').updateOne(
      { chartId: 'engagement-rate' },
      { 
        $set: { 
          'elements.0.formula': '([remoteFans] + [stadium]) > 0 ? (([remoteImages] + [hostessImages] + [selfies]) / ([remoteFans] + [stadium]) * 100) : 0',
          'elements.0.label': 'Images per Fan',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Fixed engagement-rate formula');
    
    console.log('\n🎯 All SIHF chart formulas have been updated to use available aggregate stats fields');
    
    // Verify the changes
    console.log('\n🔍 Verifying updated formulas...');
    const sihfCharts = ['report-image-1', 'report-image-2', 'unique-users', 'total-fans-engaged', 'engagement-rate'];
    
    for (const chartId of sihfCharts) {
      const chart = await db.collection('chart_configurations').findOne({ chartId });
      if (chart && chart.elements && chart.elements[0]) {
        console.log(`✅ ${chartId}: ${chart.elements[0].formula}`);
      }
    }
    
  } finally {
    await client.close();
  }
}

fixSihfChartFormulas().catch(console.error);