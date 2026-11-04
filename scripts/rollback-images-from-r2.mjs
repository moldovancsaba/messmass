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
const ROLLBACK_FILE = path.join(__dirname, 'image-migration-rollback.json');

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n========================================`);
  console.log(`MESSMASS R2 IMAGE ROLLBACK`);
  console.log(`Mode: ${isApply ? 'APPLY (will restore old URLs in database)' : 'COUNT ONLY (dry-run)'}`);
  console.log(`========================================\n`);

  if (!fs.existsSync(ROLLBACK_FILE)) {
    console.error(`Rollback file not found: ${ROLLBACK_FILE}`);
    process.exit(1);
  }

  const { rollback } = JSON.parse(fs.readFileSync(ROLLBACK_FILE, 'utf8'));
  console.log(`Loaded ${rollback.length} entries from rollback file.`);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDbName);

  let restored = 0;
  for (const r of rollback) {
    const coll = db.collection(r.collection);
    const filter = ObjectId.isValid(r.docId) ? { _id: new ObjectId(r.docId) } : { _id: r.docId };
    const mongoField = r.fieldPath.replace(/\[(\d+)\]/g, '.$1');

    if (isApply) {
      const res = await coll.updateOne(filter, { $set: { [mongoField]: r.oldUrl } });
      if (res.modifiedCount > 0) restored++;
    } else {
      const doc = await coll.findOne(filter);
      if (doc) restored++;
    }
  }

  console.log(isApply ? `Restored ${restored} of ${rollback.length} records.` : `Would restore ${restored} of ${rollback.length} records.`);
  await client.close();
}

main().catch(console.error);
