#!/usr/bin/env tsx
/**
 * Backfill script to align clicker sets data model.
 *
 * Actions:
 * 1) Ensure a default clicker set exists (clickerSets collection).
 * 2) Assign default clicker set to any variable groups missing clickerSetId.
 * 3) Set clickerSetId: null on partners that don't have the field (explicit default).
 *
 * Usage:
 *   tsx -r dotenv/config scripts/backfillClickerSets.ts dotenv_config_path=.env.local
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

async function main() {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // 1) Ensure default clicker set
  const clickerSets = db.collection('clickerSets');
  let defaultSet = await clickerSets.findOne({ isDefault: true });
  if (!defaultSet) {
    const now = new Date().toISOString();
    const insert = await clickerSets.insertOne({
      name: 'Default Clicker',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    defaultSet = await clickerSets.findOne({ _id: insert.insertedId });
    console.log(`Created default clicker set: ${insert.insertedId.toString()}`);
  } else {
    console.log(`Default clicker set exists: ${(defaultSet._id as ObjectId).toString()}`);
  }

  const defaultId = defaultSet?._id as ObjectId;

  // 2) Backfill variable groups
  const variablesGroups = db.collection('variablesGroups');
  const vgResult = await variablesGroups.updateMany(
    { $or: [{ clickerSetId: { $exists: false } }, { clickerSetId: null }] },
    { $set: { clickerSetId: defaultId } }
  );
  console.log(`Variable groups backfilled: matched ${vgResult.matchedCount}, modified ${vgResult.modifiedCount}`);

  // 3) Backfill partners (explicit null for clarity; default means use default set)
  const partners = db.collection('partners');
  const partnerResult = await partners.updateMany(
    { clickerSetId: { $exists: false } },
    { $set: { clickerSetId: null } }
  );
  console.log(`Partners backfilled: matched ${partnerResult.matchedCount}, modified ${partnerResult.modifiedCount}`);

  console.log('✅ Backfill complete.');
  await client.close();
}

main().catch((err) => {
  console.error('❌ Backfill failed', err);
  process.exit(1);
});

