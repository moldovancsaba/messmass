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
const accountId = env.MESSMASS_R2_ACCOUNT_ID;
const apiToken = env.MESSMASS_R2_API_TOKEN;
const bucket = env.MESSMASS_R2_LOGOS_BUCKET;
const publicBase = env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL;
const mongoUri = env.MONGODB_URI;
const mongoDbName = env.MONGODB_DB || 'messmass';

if (!accountId || !apiToken || !bucket || !publicBase || !mongoUri) {
  console.error('Missing required environment configuration (R2 or MongoDB)!');
  process.exit(1);
}

const EXTENSIONS = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif', svg: 'svg' };
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

const CACHE_FILE = path.join(__dirname, 'r2-migration-cache.json');
const DEAD_FILE = path.join(__dirname, 'r2-dead-images.json');
const ROLLBACK_FILE = path.join(__dirname, 'image-migration-rollback.json');
const INVENTORY_FILE = path.join(__dirname, 'image-inventory.json');
const LOGO_PLAN_FILE = '/Users/Shared/Projects/logo-migration-2026-10-07/logo-plan.json';

// Load or initialize cache
function loadCache() {
  const cache = {};
  // 1. Seed from logo-plan.json if exists
  if (fs.existsSync(LOGO_PLAN_FILE)) {
    try {
      const lp = JSON.parse(fs.readFileSync(LOGO_PLAN_FILE, 'utf8'));
      if (lp.plan) {
        for (const [url, item] of Object.entries(lp.plan)) {
          if (item?.new) {
            cache[url] = {
              r2Url: item.new,
              key: item.key,
              sha256: item.sha,
              ext: item.ext,
              source: 'logo-plan',
            };
          }
        }
      }
    } catch (e) {
      console.warn('Could not read logo-plan.json:', e.message);
    }
  }
  // 2. Overlay existing r2-migration-cache.json
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      Object.assign(cache, existing);
    } catch (e) {
      console.warn('Could not read existing cache:', e.message);
    }
  }
  return cache;
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function loadDead() {
  if (fs.existsSync(DEAD_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DEAD_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveDead(dead) {
  fs.writeFileSync(DEAD_FILE, JSON.stringify(dead, null, 2));
}

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

async function fetchAndMigrateUrl(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });

      if (res.status === 404) {
        return { dead: true, reason: 'HTTP 404' };
      }

      if (!res.ok) {
        if (attempt === retries) return { dead: false, failed: true, reason: `HTTP ${res.status}` };
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0 || buffer.length === 1031) {
        // 1031 is ImgBB's "image not found" PNG
        return { dead: true, reason: 'ImgBB 1031-byte placeholder' };
      }

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
      if (attempt === retries) {
        return { dead: false, failed: true, reason: e.message };
      }
    }
  }
}

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n========================================`);
  console.log(`MESSMASS CLOUDFLARE R2 IMAGE MIGRATION`);
  console.log(`Mode: ${isApply ? 'APPLY (will write to database)' : 'DRY RUN (read-only)'}`);
  console.log(`========================================\n`);

  if (!fs.existsSync(INVENTORY_FILE)) {
    console.error(`Inventory file not found: ${INVENTORY_FILE}`);
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
  const uniqueUrls = inventory.uniqueImgbbUrls || [];
  console.log(`Total unique ImgBB URLs to evaluate: ${uniqueUrls.length}`);
  console.log(`Total document occurrences: ${inventory.imgbbFindings?.length || 0}`);

  const cache = loadCache();
  const dead = loadDead();
  console.log(`Loaded ${Object.keys(cache).length} cached R2 URLs (including logo-plan seed).`);
  console.log(`Loaded ${Object.keys(dead).length} previously marked dead URLs.`);

  const toFetch = uniqueUrls.filter(u => !cache[u] && !dead[u]);
  console.log(`URLs requiring network fetch/upload: ${toFetch.length}\n`);

  // Download & upload in controlled concurrency
  const CONCURRENCY = 4;
  let fetchedCount = 0;
  let newR2Count = 0;
  let newDeadCount = 0;

  async function worker(urlList) {
    while (urlList.length > 0) {
      const url = urlList.shift();
      if (!url) break;

      const result = await fetchAndMigrateUrl(url);
      fetchedCount++;

      if (result.r2Url) {
        cache[url] = result;
        newR2Count++;
        console.log(`[${fetchedCount}/${toFetch.length}] ✓ Migrated: ${url} -> ${result.r2Url}`);
      } else if (result.dead) {
        dead[url] = { reason: result.reason, checkedAt: new Date().toISOString() };
        newDeadCount++;
        console.log(`[${fetchedCount}/${toFetch.length}] ✗ Dead (${result.reason}): ${url}`);
      } else {
        console.warn(`[${fetchedCount}/${toFetch.length}] ⚠️ Transient issue (${result.reason}): ${url}`);
      }

      // Save checkpoints every 10 items
      if (fetchedCount % 10 === 0) {
        saveCache(cache);
        saveDead(dead);
      }
    }
  }

  if (toFetch.length > 0) {
    console.log(`Starting migration with concurrency ${CONCURRENCY}...`);
    const queue = [...toFetch];
    const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
    await Promise.all(workers);
    saveCache(cache);
    saveDead(dead);
    console.log(`\nFetch/Upload complete. New R2: ${newR2Count}, New Dead: ${newDeadCount}\n`);
  }

  // Summary of URL statuses
  let totalLive = 0;
  let totalDead = 0;
  for (const u of uniqueUrls) {
    if (cache[u]?.r2Url) totalLive++;
    else if (dead[u]) totalDead++;
  }
  console.log(`Migration Status across all ${uniqueUrls.length} distinct URLs:`);
  console.log(`  - Ready on Cloudflare R2: ${totalLive}`);
  console.log(`  - Unrecoverable / Dead on ImgBB: ${totalDead}\n`);

  // Match occurrences in database
  const rollbackEntries = [];
  const dbUpdatesByColl = {};

  for (const f of inventory.imgbbFindings) {
    const cached = cache[f.url];
    if (cached?.r2Url) {
      rollbackEntries.push({
        collection: f.collection,
        docId: f.docId,
        fieldPath: f.fieldPath,
        oldUrl: f.url,
        newUrl: cached.r2Url,
      });

      if (!dbUpdatesByColl[f.collection]) {
        dbUpdatesByColl[f.collection] = [];
      }
      dbUpdatesByColl[f.collection].push({
        docId: f.docId,
        fieldPath: f.fieldPath,
        oldUrl: f.url,
        newUrl: cached.r2Url,
      });
    }
  }

  console.log(`Database updates prepared: ${rollbackEntries.length} occurrences across ${Object.keys(dbUpdatesByColl).length} collections.`);
  for (const [c, items] of Object.entries(dbUpdatesByColl)) {
    console.log(`  - ${c}: ${items.length} fields to update`);
  }

  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify({
    migratedAt: new Date().toISOString(),
    totalUpdates: rollbackEntries.length,
    rollback: rollbackEntries,
  }, null, 2));
  console.log(`\nRollback map written to: ${ROLLBACK_FILE}`);

  if (!isApply) {
    console.log(`\n[DRY RUN ONLY] No database modifications made. Run with --apply to execute database updates.`);
    return;
  }

  // APPLY UPDATES TO MONGODB
  console.log(`\nConnecting to MongoDB to apply updates...`);
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDbName);

  let updatedCount = 0;
  let errorCount = 0;

  for (const [collName, items] of Object.entries(dbUpdatesByColl)) {
    console.log(`Updating ${items.length} records in "${collName}"...`);
    const coll = db.collection(collName);

    // Group updates by docId
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
          // Normalize dot path for MongoDB update
          // e.g., 'stats.reportImage1' -> { 'stats.reportImage1': newUrl }
          // If path contains array notation like [12], convert to dot notation
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
  console.log(`DATABASE UPDATE SUMMARY:`);
  console.log(`  - Successfully updated occurrences: ${updatedCount}`);
  console.log(`  - Errors: ${errorCount}`);
  console.log(`========================================\n`);

  await client.close();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
