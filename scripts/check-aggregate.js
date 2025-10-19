const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  
  const projectId = '68a71ccb80a7ed4f8b4a7c77';
  
  // Check if project exists
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
  console.log('Project exists:', !!project);
  if (project) {
    console.log('Project name:', project.eventName);
    console.log('Has stats:', !!project.stats);
    console.log('Has eventDate:', !!project.eventDate);
    console.log('UpdatedAt:', project.updatedAt);
  }
  
  // Check if aggregate exists
  const aggregate = await db.collection('analytics_aggregates').findOne({ projectId: new ObjectId(projectId) });
  console.log('\nAggregate exists:', !!aggregate);
  
  // Count total aggregates
  const count = await db.collection('analytics_aggregates').countDocuments();
  console.log('Total aggregates in DB:', count);
  
  // Show one sample aggregate
  const sample = await db.collection('analytics_aggregates').findOne({});
  if (sample) {
    console.log('\nSample aggregate projectId:', sample.projectId.toString());
    console.log('Sample has fanMetrics:', !!sample.fanMetrics);
    if (sample.fanMetrics) {
      console.log('Sample totalFans:', sample.fanMetrics.totalFans);
    }
  }
  
  await client.close();
})();
