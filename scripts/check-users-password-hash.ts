#!/usr/bin/env tsx

// WHAT: Checks user password storage state (plaintext vs bcrypt hash)
// WHY: OPS-SEC-01 requires production to run with bcrypt and to avoid plaintext passwords
// HOW: Scans users collection and prints counts; exits non-zero if strict mode enabled

import { getDb } from '../lib/db';

type Options = {
  strict: boolean;
};

function parseArgs(argv: string[]): Options {
  return {
    strict: argv.includes('--strict'),
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const db = await getDb();
  const users = db.collection('users');

  const total = await users.countDocuments({});
  const withHash = await users.countDocuments({ passwordHash: { $exists: true, $type: 'string', $ne: '' } });
  const withPlaintext = await users.countDocuments({ password: { $exists: true, $type: 'string', $ne: '' } });
  const missingHash = total - withHash;

  console.log('\n🔐 Users Password Storage Check\n');
  console.log('='.repeat(60));
  console.log(`Total users:                 ${total}`);
  console.log(`Users with passwordHash:     ${withHash}`);
  console.log(`Users with plaintext password: ${withPlaintext}`);
  console.log(`Users missing passwordHash:  ${missingHash}`);
  console.log('\nNotes:');
  console.log('- Plaintext passwords are legacy and should be migrated off (bcrypt).');
  console.log('- Missing passwordHash does not necessarily mean no password exists (legacy users may still have `password`).');

  if (opts.strict) {
    if (withPlaintext > 0 || missingHash > 0) {
      console.log('\n❌ STRICT MODE FAIL');
      console.log('Remediation: ensure all users have passwordHash and no users retain plaintext password.');
      process.exit(1);
    }
    console.log('\n✅ STRICT MODE PASS');
  }
}

main().catch((err) => {
  console.error('Failed to check user password storage:', err);
  process.exit(1);
});
