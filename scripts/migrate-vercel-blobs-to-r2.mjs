import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import sharp from 'sharp';
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
const accountId = env.MESSMASS_R2_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = env.MESSMASS_R2_API_TOKEN || env.CLOUDFLARE_R2_API_TOKEN;
const bucket = env.MESSMASS_R2_LOGOS_BUCKET || env.CLOUDFLARE_R2_BUCKET || 'messmass-logos';
const publicBase = env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL || env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
const mongoUri = env.MONGODB_URI;
const mongoDbName = env.MONGODB_DB || 'messmass';

if (!accountId || !apiToken || !bucket || !publicBase || !mongoUri) {
  console.error('Missing required environment configuration (R2 or MongoDB)!');
  process.exit(1);
}

const EXTENSIONS = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif', svg: 'svg' };
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

const INVENTORY_FILE = path.join(__dirname, 'blob-inventory.json');
const CACHE_FILE = path.join(__dirname, 'r2-migration-cache.json');
const ROLLBACK_FILE = path.join(__dirname, 'blob-migration-rollback.json');

async function uploadToR2(bytes, ext) {
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const key = `reports/${sha256}.${ext}`;
  const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${encodeURIComponent(bucket)}/objects/${key}`;

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`R2 upload HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => null);
  if (json?.success !== true) {
    throw new Error(`R2 upload rejected: ${JSON.stringify(json)}`);
  }

  const publicUrl = `${publicBase}/${key}`;
  return { publicUrl, key, sha256 };
}

async function fetchAndMigrateUrl(url) {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1000));
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });

      if (!res.ok) {
        if (attempt === 2) return { failed: true, reason: `HTTP ${res.status}` };
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) return { failed: true, reason: 'Empty buffer' };

      let ext = 'jpg';
      if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(buffer.subarray(0, 2048).toString('utf8'))) {
        ext = 'svg';
      } else {
        const meta = await sharp(buffer, { failOn: 'none' }).metadata();
        ext = meta.format ? (EXTENSIONS[meta.format] || 'jpg') : 'jpg';
      }

      const r2Result = await uploadToR2(buffer, ext);
      return {
        r2Url: r2Result.publicUrl,
        key: r2Result.key,
        sha256: r2Result.sha256,
        ext,
        size: buffer.length,
      };
    } catch (e) {
      if (attempt === 2) return { failed: true, reason: e.message };
    }
  }
}

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n========================================`);
  console.log(`MESSMASS VERCEL BLOB -> CLOUDFLARE R2 MIGRATION`);
  console.log(`Mode: ${isApply ? 'APPLY (will write to database)' : 'DRY RUN (read-only)'}`);
  console.log(`Target Bucket: ${bucket} (${publicBase})`);
  console.log(`========================================\n`);

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
  const uniqueUrls = inventory.uniqueUrls || [];
  console.log(`Total unique Vercel Blob URLs to evaluate: ${uniqueUrls.length}`);
  console.log(`Total document occurrences: ${inventory.findings?.length || 0}\n`);

  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  const toFetch = uniqueUrls.filter(u => !cache[u]?.r2Url);
  console.log(`Already cached in R2: ${uniqueUrls.length - toFetch.length}`);
  console.log(`Requiring upload to R2: ${toFetch.length}\n`);

  // Concurrency 5 for smooth Vercel Blob streaming
  const CONCURRENCY = 5;
  let completed = 0;
  let succeeded = 0;
  let failed = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const u = queue.shift();
      if (!u) break;

      const res = await fetchAndMigrateUrl(u);
      completed++;
      if (res?.r2Url) {
        cache[u] = res;
        succeeded++;
        console.log(`[${completed}/${toFetch.length}] ✓ Migrated: ${u} -> ${res.r2Url}`);
      } else {
        failed++;
        console.warn(`[${completed}/${toFetch.length}] ✗ Failed: ${u} (${res?.reason})`);
      }

      if (completed % 10 === 0) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      }
    }
  }

  if (toFetch.length > 0) {
    console.log(`Uploading ${toFetch.length} files to Cloudflare R2...`);
    const q = [...toFetch];
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(q)));
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\nUpload phase finished: ${succeeded} succeeded, ${failed} failed.\n`);
  }

  // Build DB updates
  const rollbackEntries = [];
  const dbUpdatesByColl = {};

  for (const f of inventory.findings) {
    const cached = cache[f.url];
    if (cached?.r2Url) {
      rollbackEntries.push({
        collection: f.collection,
        docId: f.docId,
        fieldPath: f.fieldPath,
        oldUrl: f.url,
        newUrl: cached.r2Url,
      });

      if (!dbUpdatesByColl[f.collection]) dbUpdatesByColl[f.collection] = [];
      dbUpdatesByColl[f.collection].push({
        docId: f.docId,
        fieldPath: f.fieldPath,
        oldUrl: f.url,
        newUrl: cached.r2Url,
      });
    }
  }

  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify({
    migratedAt: new Date().toISOString(),
    totalUpdates: rollbackEntries.length,
    rollback: rollbackEntries,
  }, null, 2));
  console.log(`Rollback map written to: ${ROLLBACK_FILE}`);
  console.log(`Total database field updates prepared: ${rollbackEntries.length}\n`);

  if (!isApply) {
    console.log(`[DRY RUN ONLY] Pass --apply to execute database updates.`);
    return;
  }

  console.log(`Connecting to MongoDB to apply updates...`);
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
  console.log(`VERCEL BLOB MIGRATION SUMMARY:`);
  console.log(`  - Successfully updated occurrences: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`========================================\n`);

  await client.close();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
