const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  // Find a project with aggregate data and partner context
  const aggregate = await db.collection('analytics_aggregates').findOne({
    'partnerContext.partnerId': { $exists: true }
  });
  
  if (!aggregate) {
    console.log('❌ No aggregates with partner context found');
    await client.close();
    return;
  }
  
  console.log('✅ Found test project:');
  console.log('  Project ID:', aggregate.projectId.toString());
  console.log('  Event date:', aggregate.eventDate);
  console.log('  Partner:', aggregate.partnerContext?.partnerName || 'Unknown');
  console.log('  Total fans:', aggregate.fanMetrics?.totalFans || 0);
  console.log('  Merch penetration:', (aggregate.merchMetrics?.penetrationRate || 0).toFixed(1) + '%');
  console.log('  Ad value: €', (aggregate.adMetrics?.totalROI || 0).toFixed(0));
  
  console.log(`\n📊 Test insights API with:`);
  console.log(`  curl http://localhost:3000/api/analytics/insights/${aggregate.projectId.toString()}`);
  
  await client.close();
})();
