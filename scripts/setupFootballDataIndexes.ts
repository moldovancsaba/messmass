// scripts/setupFootballDataIndexes.ts
// WHAT: Create indexes for football_data_fixtures collection
// WHY: Ensure efficient queries for fixture browsing and matching

import 'dotenv/config';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

async function run() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const col = db.collection('football_data_fixtures');

  // Unique by external fixtureId
  await col.createIndex({ fixtureId: 1 }, { unique: true, name: 'ux_fixtureId' });

  // Common query paths
  await col.createIndex({ 'competition.id': 1, utcDate: 1 }, { name: 'ix_competition_date' });
  await col.createIndex({ status: 1, utcDate: 1 }, { name: 'ix_status_date' });
  await col.createIndex({ utcDate: 1 }, { name: 'ix_date' });
  await col.createIndex({ homePartnerId: 1, utcDate: 1 }, { name: 'ix_homePartner_date' });
  await col.createIndex({ awayPartnerId: 1, utcDate: 1 }, { name: 'ix_awayPartner_date' });

  console.log('✅ football_data_fixtures indexes created');
  await client.close();
}

run().catch((err) => {
  console.error('❌ Failed to setup Football-Data indexes', err);
  process.exit(1);
});
