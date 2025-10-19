/**
 * Backfill script: ensure all projects have derived metrics in stats
 *
 * WHAT: Adds `stats.allImages` and `stats.totalFans` to any project missing them
 * WHY: Insights benchmarking reads derived metrics from projects; historical docs may lack them
 *
 * Usage:
 *   npx tsx scripts/backfillDerivedMetrics.ts
 */

import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import config from '../lib/config';
import { addDerivedMetrics } from '../lib/projectStatsUtils';

// Load environment variables early
dotenv.config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(config.mongodbUri);
  await client.connect();
  const db = client.db(config.dbName);
  const projects = db.collection('projects');

  console.log('🔎 Scanning for projects missing derived metrics...');
  const cursor = projects.find({
    $or: [
      { 'stats.allImages': { $exists: false } },
      { 'stats.totalFans': { $exists: false } },
    ],
  });

  let processed = 0;
  let updated = 0;
  let failed = 0;

  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    processed++;

    try {
      const stats = doc.stats || {};
      const statsWithDerived = addDerivedMetrics(stats);

      await projects.updateOne(
        { _id: doc._id },
        {
          $set: {
            'stats.allImages': statsWithDerived.allImages,
            'stats.totalFans': statsWithDerived.totalFans,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      updated++;
      if (updated % 50 === 0) {
        console.log(`  ✓ Updated ${updated} / ${processed} scanned...`);
      }
    } catch (err) {
      failed++;
      console.error(`❌ Failed to update ${doc._id}:`, err);
    }
  }

  console.log('\n📊 Backfill summary');
  console.log(`  Scanned:  ${processed}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Failed:   ${failed}`);

  await client.close();
  console.log('🔌 Disconnected from MongoDB');
}

run().catch((e) => {
  console.error('💥 Unhandled error:', e);
  process.exit(1);
});
