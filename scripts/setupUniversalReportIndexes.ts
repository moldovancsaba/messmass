import { Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function setupUniversalReportIndexes(db: Db) {
  console.log('Ensuring universal report indexes on db:', db.databaseName);

  // 1. Projects collection: compound index for hashtag & partner queries
  await db.collection('projects').createIndexes([
    { key: { hashtags: 1, eventDate: -1 }, background: true },
    { key: { partner1Id: 1, eventDate: -1 }, background: true },
    { key: { partner2Id: 1, eventDate: -1 }, background: true },
  ]);

  // 2. Report Snapshots: instant SSR retrieval & TTL
  await db.collection('report_snapshots').createIndexes([
    {
      key: { scopeType: 1, scopeIdentifier: 1, sportFilter: 1 },
      unique: true,
      background: true,
    },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ]);

  // 3. Vision Analysis: idempotent ingestion and compound lookup
  await db.collection('szrt_vision_analysis').createIndexes([
    { key: { fileName: 1, sport: 1 }, unique: true, background: true },
    { key: { hashtag: 1 }, background: true },
    { key: { clubs: 1, sport: 1 }, background: true },
    { key: { brands: 1 }, background: true },
  ]);

  // 4. Dead-Letter Queue
  await db.collection('szrt_vision_dlq').createIndexes([
    { key: { createdAt: 1 }, expireAfterSeconds: 2592000 }, // 30-day retention
    { key: { fileName: 1 }, background: true },
  ]);

  console.log('All universal report indexes created successfully.');
}

if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  const dbName = process.env.MONGODB_DB || 'messmass';
  MongoClient.connect(uri).then(async (client) => {
    const db = client.db(dbName);
    await setupUniversalReportIndexes(db);
    await client.close();
  }).catch((err) => {
    console.error('Error creating indexes:', err);
    process.exit(1);
  });
}
