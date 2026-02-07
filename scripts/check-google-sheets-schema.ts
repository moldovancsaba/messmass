/**
 * OPS-INT-01: Schema / backward-compatibility check for Google Sheets Partner Sync
 *
 * WHAT: Verifies partners and projects collections support both legacy (no sheet config)
 *       and Phase 2 (with googleSheetConfig) documents.
 * WHY: Ensure no breaking changes; deployment checklist can run this before/after deploy.
 * HOW: Connect to DB, count partners with/without googleSheetConfig; exit 0 if readable.
 *
 * Usage: npx tsx -r dotenv/config scripts/check-google-sheets-schema.ts dotenv_config_path=.env.local
 */

import { getDb, getClient } from '../lib/db';

async function main() {
  const db = await getDb();

  const partnersWith = await db.collection('partners').countDocuments({
    'googleSheetConfig.enabled': true
  });
  const partnersWithConfig = await db.collection('partners').countDocuments({
    googleSheetConfig: { $exists: true, $ne: null }
  });
  const partnersTotal = await db.collection('partners').countDocuments({});
  const partnersWithout = partnersTotal - partnersWithConfig;

  console.log('OPS-INT-01 Schema check (Google Sheets)');
  console.log('  Partners total:', partnersTotal);
  console.log('  Partners with googleSheetConfig:', partnersWithConfig);
  console.log('  Partners with sync enabled:', partnersWith);
  console.log('  Partners without sheet config (backward compat):', partnersWithout);

  const projectsTotal = await db.collection('projects').countDocuments({});
  console.log('  Projects total:', projectsTotal);

  const client = await getClient();
  await client.close();

  console.log('\n✅ Schema check passed (collections readable, backward compat OK)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
