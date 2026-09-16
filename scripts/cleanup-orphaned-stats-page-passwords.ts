#!/usr/bin/env tsx
/*
 * Remove page_passwords rows for the deleted /stats route (F-007, messmass#390).
 *
 * The route was renamed to /report/ in d008046a. Its password rows stayed: 202
 * of 565, 36% of the collection, for a page that cannot be requested. They are
 * not merely unused — `stats` is not a member of the PageType union in
 * lib/pagePassword.ts, and /api/page-passwords rejects any pageType outside its
 * allowlist, so nothing in the application can read, validate or delete them.
 * They also inflate every figure taken from this collection by about a third.
 *
 * Dry-run by default. --delete writes a timestamped JSON backup of every
 * matched document to scripts/backups/ BEFORE removing anything, so the set can
 * be reinserted verbatim if a consumer of pageType 'stats' ever surfaces.
 *
 *   npx tsx -r dotenv/config scripts/cleanup-orphaned-stats-page-passwords.ts dotenv_config_path=.env.local
 *   npx tsx -r dotenv/config scripts/cleanup-orphaned-stats-page-passwords.ts --delete dotenv_config_path=.env.local
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const ORPHANED_PAGE_TYPE = 'stats';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required.');
  const dbName = process.env.MONGODB_DB || 'messmass';
  const commit = process.argv.includes('--delete');

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const collection = db.collection('page_passwords');

    const total = await collection.countDocuments();
    const byType = await collection
      .aggregate<{ _id: string; n: number }>([{ $group: { _id: '$pageType', n: { $sum: 1 } } }])
      .toArray();

    console.log(`page_passwords in "${dbName}": ${total} documents`);
    for (const row of byType.sort((a, b) => b.n - a.n)) {
      const flag = row._id === ORPHANED_PAGE_TYPE ? '  <-- orphaned, no such route' : '';
      console.log(`  ${String(row._id).padEnd(18)} ${String(row.n).padStart(4)}${flag}`);
    }

    const matched = await collection.find({ pageType: ORPHANED_PAGE_TYPE }).toArray();
    console.log(`\nMatched for removal: ${matched.length}`);
    if (matched.length === 0) {
      console.log('Nothing to do.');
      return;
    }
    console.log('Sample ids:', matched.slice(0, 3).map((d) => String(d._id)).join(', '));

    if (!commit) {
      console.log('\nDRY RUN — nothing was changed. Re-run with --delete to apply.');
      return;
    }

    const dir = path.join(process.cwd(), 'scripts', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const backup = path.join(dir, `page-passwords-stats-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backup, JSON.stringify(matched, null, 2));
    console.log(`\nBackup written: ${path.relative(process.cwd(), backup)} (${matched.length} documents)`);

    const result = await collection.deleteMany({ pageType: ORPHANED_PAGE_TYPE });
    console.log(`Deleted: ${result.deletedCount}`);

    // Re-count so the report is the database's answer, not the script's.
    const after = await collection
      .aggregate<{ _id: string; n: number }>([{ $group: { _id: '$pageType', n: { $sum: 1 } } }])
      .toArray();
    console.log(`\nAfter — ${await collection.countDocuments()} documents:`);
    for (const row of after.sort((a, b) => b.n - a.n)) {
      console.log(`  ${String(row._id).padEnd(18)} ${String(row.n).padStart(4)}`);
    }
    const leftover = await collection.countDocuments({ pageType: ORPHANED_PAGE_TYPE });
    if (leftover !== 0) throw new Error(`${leftover} orphaned rows remain — expected 0.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
