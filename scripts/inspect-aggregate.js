const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  const projectId = '68b01f835eb842d4f6c9fd1f';
  
  const aggregate = await db.collection('analytics_aggregates').findOne({ 
    projectId: new ObjectId(projectId) 
  });
  
  if (aggregate) {
    console.log('📊 Aggregate Structure:');
    console.log('=====================================');
    console.log('ProjectId:', aggregate.projectId.toString());
    console.log('Event Date:', aggregate.eventDate);
    console.log('Aggregation Type:', aggregate.aggregationType);
    console.log('\n🎯 Fan Metrics:');
    console.log(JSON.stringify(aggregate.fanMetrics, null, 2));
    console.log('\n🛍️ Merch Metrics:');
    console.log(JSON.stringify(aggregate.merchMetrics, null, 2));
    console.log('\n💰 Ad Metrics:');
    console.log(JSON.stringify(aggregate.adMetrics, null, 2));
    console.log('\n📊 Has Raw Stats:', !!aggregate.rawStats);
    console.log('Version:', aggregate.version);
    console.log('Updated At:', aggregate.updatedAt);
  } else {
    console.log('❌ Aggregate not found');
  }
  
  await client.close();
})();
