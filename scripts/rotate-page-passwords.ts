// scripts/rotate-page-passwords.ts
// WHAT: Rotate every page password to a fresh value stored only as a bcrypt hash.
// WHY: Audit F-010 — POST /api/page-passwords returned a working password to any
//     anonymous caller who knew the pageId, and the pageId is in the page's own
//     URL. Every configured password must therefore be treated as already
//     disclosed. Hashing the existing values would preserve known secrets, so
//     they are replaced, not migrated.
// HOW: Each document gets a new 128-bit random password; only its hash is
//     written and the plaintext `password` field is removed. The new plaintext is
//     NOT printed and NOT stored anywhere — it is unrecoverable by design. Share
//     links are re-issued from the admin UI, which reveals a password once at
//     generation.
//
// Existing shared links stop working. That is the intended, approved outcome.
//
//   Dry run:  npx tsx -r dotenv/config scripts/rotate-page-passwords.ts dotenv_config_path=.env.local
//   Execute:  npx tsx -r dotenv/config scripts/rotate-page-passwords.ts dotenv_config_path=.env.local --commit

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const commit = process.argv.includes('--commit');
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'messmass';
  if (!uri) throw new Error('MONGODB_URI is required');

  const client = new MongoClient(uri);
  await client.connect();
  const collection = client.db(dbName).collection('page_passwords');

  const total = await collection.countDocuments({});
  const withPlaintext = await collection.countDocuments({ password: { $exists: true } });
  const withHash = await collection.countDocuments({ passwordHash: { $exists: true } });

  console.log(`page_passwords documents : ${total}`);
  console.log(`  carrying plaintext     : ${withPlaintext}`);
  console.log(`  carrying a hash        : ${withHash}`);
  console.log(commit ? '\nMODE: COMMIT — rotating now.\n' : '\nMODE: DRY RUN — nothing will be written.\n');

  if (!commit) {
    console.log('Every document above would be given a new random password, stored');
    console.log('as a bcrypt hash, with the plaintext field removed. Re-run with');
    console.log('--commit to apply. Existing share links will stop working.');
    await client.close();
    return;
  }

  const cursor = collection.find({}, { projection: { _id: 1 } });
  let rotated = 0;
  for await (const doc of cursor) {
    // 16 random bytes -> 32 hex chars, matching generateMD5StylePassword().
    const plaintext = randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(plaintext, SALT_ROUNDS);
    await collection.updateOne(
      { _id: doc._id },
      { $set: { passwordHash, rotatedAt: new Date().toISOString() }, $unset: { password: '' } }
    );
    rotated++;
    if (rotated % 100 === 0) console.log(`  rotated ${rotated}/${total}`);
    // The plaintext deliberately goes out of scope here without being logged,
    // returned, or written. Nothing in this process can recover it afterwards.
  }

  const leftoverPlaintext = await collection.countDocuments({ password: { $exists: true } });
  const nowHashed = await collection.countDocuments({ passwordHash: { $exists: true } });
  console.log(`\nrotated                  : ${rotated}`);
  console.log(`documents with a hash    : ${nowHashed}/${total}`);
  console.log(`plaintext fields left    : ${leftoverPlaintext} (must be 0)`);
  if (leftoverPlaintext !== 0 || nowHashed !== total) {
    console.error('VERIFICATION FAILED — inspect before trusting this run.');
    process.exitCode = 1;
  } else {
    console.log('\nAll page passwords rotated. Previous values are void.');
  }
  await client.close();
}

main().catch((e) => {
  console.error('rotation failed:', e.message);
  process.exit(1);
});
