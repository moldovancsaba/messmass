/**
 * Migrate notifications to the 2026-07-05 ground-up schema.
 *
 * WHAT: Backfills the fields the rebuilt notification system relies on, on
 *       documents created before the rebuild:
 *         - `occurredAt` (BSON Date)  ← derived from `timestamp`/`createdAt`
 *                                       so the TTL retention index applies to them
 *         - `actorId` (null)          ← historical author id is unknown; the
 *                                       display name remains in `user`
 * WHY:  Old docs store `timestamp` as an ISO string and have no `occurredAt`,
 *       so a TTL index on `occurredAt` (see scripts/ensure-notification-indexes /
 *       createMissingIndexes) would never expire them. This makes the whole
 *       collection retention-eligible.
 *
 * SAFETY: Non-destructive. Only ADDS missing fields; never deletes or renames.
 *         Historical `dedupeKey` is intentionally left absent (the sparse unique
 *         index excludes these rows; retroactive grouping is meaningless).
 *
 * Run (needs a real DB connection):
 *   npm run migrate:notifications            # dry-run: report only
 *   npm run migrate:notifications -- --apply # perform the backfill
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const APPLY = process.argv.includes('--apply');

async function main(): Promise<void> {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Provide it via .env.local (dotenv) or the environment.');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB);
    const notifications = db.collection('notifications');

    const total = await notifications.countDocuments({});
    const missingOccurredAt = await notifications.countDocuments({ occurredAt: { $exists: false } });
    const missingActorId = await notifications.countDocuments({ actorId: { $exists: false } });

    console.log(`notifications: ${total} total`);
    console.log(`  missing occurredAt: ${missingOccurredAt}`);
    console.log(`  missing actorId:    ${missingActorId}`);

    if (!APPLY) {
      console.log('\nDry-run only. Re-run with -- --apply to backfill.');
      return;
    }

    // Backfill actorId = null where absent (cheap, single updateMany).
    if (missingActorId > 0) {
      const r = await notifications.updateMany(
        { actorId: { $exists: false } },
        { $set: { actorId: null } }
      );
      console.log(`  set actorId=null on ${r.modifiedCount} docs`);
    }

    // Backfill occurredAt from timestamp/createdAt (per-doc because the value derives from each row).
    let converted = 0;
    let failed = 0;
    const cursor = notifications.find({ occurredAt: { $exists: false } }, { projection: { timestamp: 1, createdAt: 1 } });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      const source = (doc.timestamp as string) || (doc.createdAt as string);
      const date = source ? new Date(source) : null;
      if (!date || Number.isNaN(date.getTime())) {
        failed += 1;
        continue;
      }
      await notifications.updateOne({ _id: doc._id }, { $set: { occurredAt: date } });
      converted += 1;
      if (converted % 500 === 0) console.log(`  ...${converted} occurredAt backfilled`);
    }
    console.log(`  backfilled occurredAt on ${converted} docs (${failed} unparseable timestamps skipped)`);
    console.log('\nDone. Now (re)create indexes so the TTL applies: npm run db:create-indexes');
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
