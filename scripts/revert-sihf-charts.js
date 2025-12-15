require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function revertSihfCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔄 Reverting SIHF chart formulas to work with standard event charts...');
    
    // Revert unique-users to use standard demographic calculation
    await db.collection('chart_configurations').updateOne(
      { chartId: 'unique-users' },
      { 
        $set: { 
          'elements.0.formula': '[female] + [male]',
          'elements.0.label': 'Total Fans',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Reverted unique-users to standard fan calculation');
    
    // Revert total-fans-engaged to use standard image calculation  
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
    console.log('✅ Reverted total-fans-engaged to standard image calculation');
    
    // Revert engagement-rate to use standard engagement calculation
    await db.collection('chart_configurations').updateOne(
      { chartId: 'engagement-rate' },
      { 
        $set: { 
          'elements.0.formula': '([female] + [male]) > 0 ? (([remoteImages] + [hostessImages] + [selfies]) / ([female] + [male]) * 100) : 0',
          'elements.0.label': 'Images per Fan %',
          updatedAt: new Date().toISOString()
        }
      }
    );
    console.log('✅ Reverted engagement-rate to standard engagement calculation');
    
    console.log('\n🎯 SIHF charts now use standard formulas that work with aggregated event data');
    
  } finally {
    await client.close();
  }
}

revertSihfCharts().catch(console.error);