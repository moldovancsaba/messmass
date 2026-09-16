#!/usr/bin/env tsx
/*
 * Remove the plaintext passwords that double as public-API keys (F-011,
 * messmass#397).
 *
 * `validateAPIKey` resolves a Bearer token by trying `findUserByApiKeyHash`
 * first and falling back to `findUserByPassword`, which does
 * `col.findOne({ password })` — so for any account without an `apiKeyHash`, the
 * API key IS the user's plaintext login password, stored in the clear. Nothing
 * serves that field back out, so the exposure is at rest: any dump, backup or
 * log of a user document yields a working credential.
 *
 * Why this is safe to do rather than a rotation:
 *   - Only two accounts have apiKeyEnabled — camera@messmass.com and
 *     fanmass@doneisbetter.com — and both lack `apiUsageCount` entirely. Not
 *     zero: absent. `updateAPIUsage` uses $inc, which would create the field on
 *     first success, so neither key has ever authenticated a request.
 *   - The fleet integrations do not use this path. app/api/integrations/camera/*
 *     authenticate with assertCameraSecret, and requireAPIAuth is called only by
 *     four /api/public/* routes.
 * Removing the field therefore revokes credentials nothing has ever used.
 *
 * It deliberately does NOT mint replacements. The admin UI's rotate action
 * (app/api/admin/local-users/[id]/api-access) generates a hashed key and shows
 * it to the operator once; a script that minted keys would have to hand the
 * secret somewhere, and the right somewhere is not a terminal transcript.
 * `apiKeyEnabled` is left as it is, so rotating one in later needs no other
 * change.
 *
 * Also strips the plaintext password from the single local_users document. That
 * collection is read by no application code — only three maintenance scripts —
 * and local login returns 410 Gone, so the credential authenticates nothing and
 * is pure at-rest exposure.
 *
 * Dry-run by default; --apply writes a backup of every touched document first.
 *
 *   npx tsx -r dotenv/config scripts/retire-plaintext-api-credentials.ts dotenv_config_path=.env.local
 *   npx tsx -r dotenv/config scripts/retire-plaintext-api-credentials.ts --apply dotenv_config_path=.env.local
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required.');
  const dbName = process.env.MONGODB_DB || 'messmass';
  const apply = process.argv.includes('--apply');

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const users = db.collection('users');
    const localUsers = db.collection('local_users');

    const withPlaintext = await users.find({ password: { $exists: true } }).toArray();
    const localWithPlaintext = await localUsers.find({ password: { $exists: true } }).toArray();

    console.log(`Accounts carrying a plaintext password in "${dbName}":\n`);
    for (const u of withPlaintext) {
      console.log(
        `  users/${String(u.email).padEnd(30)} role=${String(u.role).padEnd(10)} ` +
          `apiKeyEnabled=${u.apiKeyEnabled ? 'yes' : 'no '} ` +
          `apiKeyHash=${u.apiKeyHash ? 'set' : 'absent'} ` +
          `apiUsageCount=${u.apiUsageCount ?? 'ABSENT (never authenticated)'}`
      );
    }
    for (const u of localWithPlaintext) {
      console.log(`  local_users/${String(u.email).padEnd(24)} role=${String(u.role)} (collection read by no app code)`);
    }

    const everUsed = withPlaintext.filter((u) => typeof u.apiUsageCount === 'number' && u.apiUsageCount > 0);
    if (everUsed.length > 0) {
      // The premise of this script is that these credentials have never worked.
      // If that stops being true, stop — the account needs a planned rotation
      // with whoever holds the key, not a silent revocation.
      throw new Error(
        `Refusing to run: ${everUsed.map((u) => u.email).join(', ')} shows API usage. ` +
          'Rotate through the admin UI instead of revoking.'
      );
    }

    const total = withPlaintext.length + localWithPlaintext.length;
    console.log(`\n${total} document(s) would have their plaintext password removed.`);
    if (total === 0) return;

    if (!apply) {
      console.log('\nDRY RUN — nothing was changed. Re-run with --apply.');
      return;
    }

    const dir = path.join(process.cwd(), 'scripts', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const backup = path.join(dir, `plaintext-credentials-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backup, JSON.stringify({ users: withPlaintext, local_users: localWithPlaintext }, null, 2));
    console.log(`\nBackup written: ${path.relative(process.cwd(), backup)}`);

    const a = await users.updateMany({ password: { $exists: true } }, { $unset: { password: '' } });
    const b = await localUsers.updateMany({ password: { $exists: true } }, { $unset: { password: '' } });
    console.log(`users: ${a.modifiedCount} modified · local_users: ${b.modifiedCount} modified`);

    const remaining =
      (await users.countDocuments({ password: { $exists: true } })) +
      (await localUsers.countDocuments({ password: { $exists: true } }));
    console.log(`\nPlaintext passwords remaining across both collections: ${remaining}`);
    if (remaining !== 0) throw new Error('Expected 0 remaining.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
