#!/usr/bin/env tsx

// WHAT: Migrates legacy plaintext login passwords to bcrypt hashes
// WHY: OPS-SEC-01 requires bcrypt auth in production and removal of plaintext login passwords
// HOW: For users who have `password` but no `passwordHash`, set passwordHash and unset password
//
// IMPORTANT: API keys are currently stored in `password` for apiKeyEnabled users.
// This script intentionally skips apiKeyEnabled users to avoid breaking API auth.

import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db';

const BCRYPT_SALT_ROUNDS = 12;

type Options = {
  dryRun: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): Options {
  const dryRun = argv.includes('--dry-run');
  const limitArg = argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
  return { dryRun, limit: Number.isFinite(limit) ? limit : undefined };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const db = await getDb();
  const users = db.collection('users');

  const query = {
    password: { $exists: true, $type: 'string', $ne: '' },
    $or: [{ passwordHash: { $exists: false } }, { passwordHash: '' }],
    $or: [{ apiKeyEnabled: { $ne: true } }, { apiKeyEnabled: { $exists: false } }],
  } as any;

  const cursor = users.find(query).sort({ updatedAt: 1 });
  if (opts.limit) cursor.limit(opts.limit);

  const candidates = await cursor.toArray();
  console.log('\n🔁 Migrate Users to passwordHash\n');
  console.log('='.repeat(60));
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Mode: ${opts.dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log('Notes: apiKeyEnabled users are skipped to avoid breaking API keys.');

  let migrated = 0;
  for (const user of candidates) {
    const id = String(user._id);
    const email = String(user.email || '').toLowerCase();
    const password = String(user.password || '');
    if (!password) continue;

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    if (opts.dryRun) {
      migrated++;
      continue;
    }

    await users.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash, updatedAt: new Date().toISOString() },
        $unset: { password: '' },
      }
    );
    migrated++;

    if (migrated % 25 === 0) {
      console.log(`...migrated ${migrated} (latest: ${email || id})`);
    }
  }

  console.log('\nDone.');
  console.log(`Migrated: ${migrated}`);
  if (opts.dryRun) {
    console.log('\nNext: run without --dry-run to apply changes.');
  } else {
    console.log('\nNext: run `npm run security:check-users-password-hash -- --strict` to confirm.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

