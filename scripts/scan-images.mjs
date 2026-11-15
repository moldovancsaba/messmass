import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local or .env.vercel-production.local
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
const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB || 'messmass';

if (!uri) {
  console.error('MONGODB_URI is not set in .env.local or .env.vercel-production.local');
  process.exit(1);
}

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

function findUrlsInValue(val, currentPath = '', results = []) {
  if (val === null || val === undefined) return results;
  if (typeof val === 'string') {
    const matches = val.match(URL_REGEX);
    if (matches) {
      for (const url of matches) {
        results.push({ path: currentPath, url });
      }
    }
  } else if (Array.isArray(val)) {
    val.forEach((item, index) => {
      findUrlsInValue(item, `${currentPath}[${index}]`, results);
    });
  } else if (typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) {
      const nextPath = currentPath ? `${currentPath}.${k}` : k;
      findUrlsInValue(v, nextPath, results);
    }
  }
  return results;
}

async function main() {
  console.log(`Connecting to MongoDB (${dbName})...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(dbName);

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections.`);

  const allFindings = [];
  const imgbbFindings = [];
  const r2Findings = [];
  const blobFindings = [];
  const otherFindings = [];

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith('system.') || collName.startsWith('_tmp_')) continue;

    const coll = db.collection(collName);
    const count = await coll.countDocuments();
    if (count === 0) continue;

    console.log(`Scanning collection "${collName}" (${count} docs)...`);
    const cursor = coll.find({});
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;
      const docId = doc._id ? doc._id.toString() : 'no-id';

      const urls = findUrlsInValue(doc);
      for (const { path: fieldPath, url } of urls) {
        const isImg = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url) ||
                      url.includes('ibb.co') ||
                      url.includes('imgbb.com') ||
                      url.includes('r2.dev') ||
                      url.includes('blob.vercel-storage.com') ||
                      url.includes('thesportsdb.com') ||
                      fieldPath.toLowerCase().includes('logo') ||
                      fieldPath.toLowerCase().includes('image') ||
                      fieldPath.toLowerCase().includes('banner') ||
                      fieldPath.toLowerCase().includes('photo');

        if (!isImg) continue;

        const finding = {
          collection: collName,
          docId,
          fieldPath,
          url,
        };

        allFindings.push(finding);

        if (url.includes('ibb.co') || url.includes('imgbb.com')) {
          imgbbFindings.push(finding);
        } else if (url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com')) {
          r2Findings.push(finding);
        } else if (url.includes('blob.vercel-storage.com')) {
          blobFindings.push(finding);
        } else {
          otherFindings.push(finding);
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('SCAN SUMMARY:');
  console.log(`Total image/media URL occurrences: ${allFindings.length}`);
  console.log(`  - ImgBB (i.ibb.co / imgbb.com):    ${imgbbFindings.length}`);
  console.log(`  - Cloudflare R2 (r2.dev):          ${r2Findings.length}`);
  console.log(`  - Vercel Blob:                     ${blobFindings.length}`);
  console.log(`  - Other external (SportsDB, etc):  ${otherFindings.length}`);
  console.log('========================================\n');

  // Group ImgBB findings by collection and fieldPath
  const imgbbByColl = {};
  const uniqueImgbbUrls = new Set();
  for (const f of imgbbFindings) {
    uniqueImgbbUrls.add(f.url);
    const key = `${f.collection} -> ${f.fieldPath}`;
    imgbbByColl[key] = (imgbbByColl[key] || 0) + 1;
  }

  console.log(`Distinct ImgBB URLs to migrate: ${uniqueImgbbUrls.size}\n`);
  console.log('ImgBB occurrences by collection and field:');
  for (const [key, count] of Object.entries(imgbbByColl).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }

  const outPath = path.join(rootDir, 'scripts', 'image-inventory.json');
  fs.writeFileSync(outPath, JSON.stringify({
    scannedAt: new Date().toISOString(),
    totalFindings: allFindings.length,
    imgbbCount: imgbbFindings.length,
    uniqueImgbbUrlsCount: uniqueImgbbUrls.size,
    uniqueImgbbUrls: Array.from(uniqueImgbbUrls),
    imgbbByCollectionAndField: imgbbByColl,
    imgbbFindings,
    r2Count: r2Findings.length,
    blobCount: blobFindings.length,
    otherCount: otherFindings.length,
    otherFindings: otherFindings.slice(0, 50),
  }, null, 2));

  console.log(`\nInventory saved to ${outPath}`);
  await client.close();
}

main().catch(err => {
  console.error('Scan failed:', err);
  process.exit(1);
});
