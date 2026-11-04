import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnv() {
  const envPaths = [
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env.vercel-production.local'),
  ];
  const env = {};
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const eq = trimmed.indexOf('=');
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!env[key]) env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const mongoUri = env.MONGODB_URI;
const mongoDbName = env.MONGODB_DB || 'messmass';
const publicBase = env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL;

const PLACEHOLDER_URL = `${publicBase}/reports/placeholders/image-missing.svg`;
const INVENTORY_FILE = path.join(__dirname, 'image-inventory.json');
const CACHE_FILE = path.join(__dirname, 'r2-migration-cache.json');
const ROLLBACK_FILE = path.join(__dirname, 'dead-images-remediation-rollback.json');

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n========================================`);
  console.log(`MESSMASS DEAD IMGBB IMAGE REMEDIATION`);
  console.log(`Mode: ${isApply ? 'APPLY (will write to database)' : 'DRY RUN (read-only)'}`);
  console.log(`Placeholder: ${PLACEHOLDER_URL}`);
  console.log(`========================================\n`);

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

  // Find all occurrences that were NOT migrated to R2 (i.e. dead on ImgBB)
  const deadFindings = inventory.imgbbFindings.filter(f => !cache[f.url]);
  console.log(`Found ${deadFindings.length} document occurrences pointing to dead ImgBB URLs.`);

  const rollbackEntries = [];
  const dbUpdatesByColl = {};

  for (const f of deadFindings) {
    rollbackEntries.push({
      collection: f.collection,
      docId: f.docId,
      fieldPath: f.fieldPath,
      oldUrl: f.url,
      newUrl: PLACEHOLDER_URL,
    });

    if (!dbUpdatesByColl[f.collection]) dbUpdatesByColl[f.collection] = [];
    dbUpdatesByColl[f.collection].push({
      docId: f.docId,
      fieldPath: f.fieldPath,
      oldUrl: f.url,
      newUrl: PLACEHOLDER_URL,
    });
  }

  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify({
    remediatedAt: new Date().toISOString(),
    totalUpdates: rollbackEntries.length,
    placeholderUrl: PLACEHOLDER_URL,
    rollback: rollbackEntries,
  }, null, 2));
  console.log(`Rollback journal written to: ${ROLLBACK_FILE}`);

  if (!isApply) {
    console.log(`\n[DRY RUN ONLY] Run with --apply to replace dead ImgBB URLs with R2 placeholder.`);
    return;
  }

  console.log(`\nConnecting to MongoDB to apply updates...`);
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDbName);

  let updatedCount = 0;
  let errorCount = 0;

  for (const [collName, items] of Object.entries(dbUpdatesByColl)) {
    console.log(`Updating ${items.length} records in "${collName}"...`);
    const coll = db.collection(collName);

    const byDocId = {};
    for (const item of items) {
      if (!byDocId[item.docId]) byDocId[item.docId] = [];
      byDocId[item.docId].push(item);
    }

    for (const [docId, docItems] of Object.entries(byDocId)) {
      try {
        let filter;
        if (ObjectId.isValid(docId)) {
          filter = { _id: new ObjectId(docId) };
        } else {
          filter = { _id: docId };
        }

        const updateSet = {};
        for (const it of docItems) {
          const mongoField = it.fieldPath.replace(/\[(\d+)\]/g, '.$1');
          updateSet[mongoField] = it.newUrl;
        }

        const res = await coll.updateOne(filter, { $set: updateSet });
        if (res.modifiedCount > 0 || res.matchedCount > 0) {
          updatedCount += docItems.length;
        }
      } catch (err) {
        console.error(`Error updating ${collName} doc ${docId}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`DEAD IMGBB REMEDIATION SUMMARY:`);
  console.log(`  - Successfully replaced occurrences: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`========================================\n`);

  await client.close();
}

main().catch(err => {
  console.error('Remediation failed:', err);
  process.exit(1);
});
