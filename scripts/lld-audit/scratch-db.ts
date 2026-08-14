// scripts/lld-audit/scratch-db.ts
// WHAT: Disposable-database harness for audit rule R3 (execute every
//     state-changing flow rather than reading it).
// WHY: R3 requires running flows that write data. Running them against the real
//     database is unacceptable, and running them against nothing means the audit
//     documents intent instead of behaviour — which is the failure R2 forbids.
//     This gives every sweep phase a database it may freely corrupt.
// HOW: A local mongod (verified reachable at 127.0.0.1:27017) with a hard naming
//     guard. Every scratch database name must start with `lld_scratch_`, checked
//     before connect and again before drop. The guard exists because this host
//     also runs the fanmass database, and a mistyped name in a teardown call is a
//     one-keystroke path to destroying someone's real data.
//
// Usage in an audit script:
//     import { withScratchDb } from './scratch-db';
//     await withScratchDb('phase3-projects', async (db) => { ... });
//
// Self-check: npx tsx scripts/lld-audit/scratch-db.ts

import { MongoClient, Db } from 'mongodb';

const HOST = process.env.LLD_SCRATCH_URI || 'mongodb://127.0.0.1:27017';
const PREFIX = 'lld_scratch_';

// WHAT: Refuse to touch any database not carrying the scratch prefix.
// WHY: This is the only thing standing between a teardown bug and the fanmass
//     database on the same mongod. It is checked twice on purpose — once on
//     acquire and once on drop — because the drop is the irreversible half.
function assertScratch(name: string): void {
  if (!name.startsWith(PREFIX)) {
    throw new Error(
      `Refusing to operate on "${name}": scratch databases must start with "${PREFIX}". ` +
      `This guard protects the other databases on this mongod.`
    );
  }
}

export function scratchName(label: string): string {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  // No timestamp: a deterministic name makes a failed run's leftovers findable
  // and re-inspectable rather than accumulating orphaned databases.
  return `${PREFIX}${safe}`;
}

export async function withScratchDb<T>(
  label: string,
  fn: (db: Db, client: MongoClient) => Promise<T>,
  options: { keep?: boolean } = {}
): Promise<T> {
  const name = scratchName(label);
  assertScratch(name);
  const client = new MongoClient(HOST, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  try {
    const db = client.db(name);
    return await fn(db, client);
  } finally {
    if (!options.keep) {
      assertScratch(name);
      await client.db(name).dropDatabase();
    }
    await client.close();
  }
}

// WHAT: Confirm the harness works and the guard actually refuses.
// WHY: A safety guard nobody tested is not a safety guard. Phase 0's exit
//     criterion includes this check passing.
async function selfCheck(): Promise<void> {
  const results: string[] = [];

  const roundTrip = await withScratchDb('selfcheck', async (db) => {
    await db.collection('probe').insertOne({ ok: true, at: new Date().toISOString() });
    return db.collection('probe').countDocuments({});
  });
  results.push(`write/read round-trip: ${roundTrip === 1 ? 'PASS' : `FAIL (${roundTrip})`}`);

  const client = new MongoClient(HOST, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const after = await client.db().admin().listDatabases();
  const leaked = after.databases.filter((d) => d.name === scratchName('selfcheck'));
  results.push(`teardown dropped the database: ${leaked.length === 0 ? 'PASS' : 'FAIL'}`);
  await client.close();

  let guarded = false;
  try {
    assertScratch('fanmass');
  } catch {
    guarded = true;
  }
  results.push(`guard refuses a non-scratch name: ${guarded ? 'PASS' : 'FAIL'}`);

  results.forEach((r) => console.log(' -', r));
  if (results.some((r) => r.includes('FAIL'))) process.exit(1);
  console.log('scratch-db harness OK');
}

if (process.argv[1] && process.argv[1].endsWith('scratch-db.ts')) {
  selfCheck().catch((e) => {
    console.error('scratch-db self-check failed:', e.message);
    process.exit(1);
  });
}
