#!/usr/bin/env node
/**
 * Pre-Flight Data Safety Audit, Snapshot & Diff Verifier
 *
 * Usage:
 *   node preflight-audit.js --audit-clusters
 *   node preflight-audit.js --snapshot projects,partners --out /path/to/backup_dir
 *   node preflight-audit.js --verify /path/to/backup_dir --collections projects,partners
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('/Users/Shared/Projects/messmass/node_modules/dotenv');
const { MongoClient } = require('/Users/Shared/Projects/messmass/node_modules/mongodb');

function maskUri(uri) {
  if (!uri) return '(unset)';
  return String(uri).replace(/\/\/[^@]+@/, '//***@');
}

function extractHost(uri) {
  if (!uri) return '(unset)';
  const withoutScheme = String(uri).replace(/^mongodb(?:\+srv)?:\/\//, '');
  const atIndex = withoutScheme.lastIndexOf('@');
  const hostPart = atIndex >= 0 ? withoutScheme.slice(atIndex + 1) : withoutScheme;
  return hostPart.split('/')[0]?.split('?')[0] || '(unknown)';
}

function loadMessmassUri() {
  const envLocal = '/Users/Shared/Projects/messmass/.env.local';
  const parsed = fs.existsSync(envLocal) ? dotenv.parse(fs.readFileSync(envLocal, 'utf8')) : {};
  const uri = process.env.MONGODB_URI || parsed.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured in process.env or /Users/Shared/Projects/messmass/.env.local');
  }
  return uri;
}

async function auditClusters() {
  console.log('=== PRE-FLIGHT CLUSTER & ENVIRONMENT ALIGNMENT AUDIT ===\n');
  const envFiles = [
    ['/Users/Shared/Projects/messmass/.env.local', 'MONGODB_URI'],
    ['/Users/Shared/Projects/messmass/.vercel/.env.production.local', 'MONGODB_URI'],
    ['/Users/Shared/Projects/camera/.env', 'MONGODB_URI'],
    ['/Users/Shared/Projects/fanmass/.env', 'CAMERA_ATLAS_URI'],
    ['/Users/Shared/Projects/sso/.env.production.local', 'MONGODB_URI'],
  ];

  const hostsByRepo = [];
  for (const [filePath, key] of envFiles) {
    if (!fs.existsSync(filePath)) continue;
    const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
    const val = parsed[key];
    hostsByRepo.push({ file: filePath, key, host: extractHost(val), masked: maskUri(val) });
    console.log(`${filePath} [${key}] -> host: ${extractHost(val)}`);
  }

  const mmLocal = hostsByRepo.find((r) => r.file.endsWith('messmass/.env.local'));
  const mmVercel = hostsByRepo.find((r) => r.file.endsWith('messmass/.vercel/.env.production.local'));
  if (mmLocal && mmVercel && mmLocal.host !== mmVercel.host) {
    console.error(`\n[CRITICAL SPLIT-BRAIN DETECTED] messmass local (${mmLocal.host}) !== Vercel production (${mmVercel.host})!`);
    process.exit(2);
  }

  const uri = loadMessmassUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('messmass');
  const criticalCols = [
    'projects',
    'partners',
    'organizations',
    'brand_assets',
    'report_templates',
    'report_styles',
    'data_blocks',
    'charts',
    'chart_configurations',
    'variables_metadata',
  ];

  console.log(`\nConnected to authoritative Messmass cluster: ${extractHost(uri)} / db: messmass`);
  for (const col of criticalCols) {
    const count = await db.collection(col).countDocuments();
    const latest = await db
      .collection(col)
      .find({}, { projection: { updatedAt: 1, name: 1, eventName: 1 } })
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    const latestDoc = latest[0];
    console.log(
      `  - ${col.padEnd(22)} count=${String(count).padStart(5)} | latest updatedAt=${latestDoc?.updatedAt || 'n/a'} (${latestDoc?.eventName || latestDoc?.name || latestDoc?._id || 'n/a'})`
    );
  }
  await client.close();
}

async function snapshotCollections(collectionsCsv, outDir) {
  const cols = collectionsCsv.split(',').map((s) => s.trim()).filter(Boolean);
  if (!cols.length || !outDir) {
    throw new Error('Usage: --snapshot col1,col2 --out /path/to/dir');
  }
  fs.mkdirSync(outDir, { recursive: true });
  const uri = loadMessmassUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('messmass');
  const ts = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + 'Z';

  console.log(`=== PRE-FLIGHT SNAPSHOT (${extractHost(uri)}) ===`);
  for (const col of cols) {
    const docs = await db.collection(col).find({}).toArray();
    const jsonPath = path.join(outDir, `${col}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(docs, null, 2));
    const backupCol = `${col}_backup_${ts}`;
    const exists = await db.listCollections({ name: backupCol }).toArray();
    if (exists.length === 0 && docs.length > 0) {
      await db.collection(backupCol).insertMany(docs);
    }
    const verifyCount = exists.length === 0 && docs.length > 0 ? await db.collection(backupCol).countDocuments() : docs.length;
    if (verifyCount !== docs.length) {
      throw new Error(`Backup verification failed for ${col}: live=${docs.length}, backup=${verifyCount}`);
    }
    console.log(`  [OK] ${col}: ${docs.length} docs saved to ${jsonPath} and Atlas ${backupCol}`);
  }
  await client.close();
}

async function verifyAgainstBackup(backupDir, collectionsCsv) {
  const cols = collectionsCsv.split(',').map((s) => s.trim()).filter(Boolean);
  const uri = loadMessmassUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('messmass');

  let violations = 0;
  console.log(`=== POST-MUTATION REGRESSION AUDIT (${extractHost(uri)}) ===`);
  for (const col of cols) {
    const beforePath = path.join(backupDir, `${col}.json`);
    const beforeDocs = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
    const afterDocs = await db.collection(col).find({}).toArray();
    const afterMap = new Map(afterDocs.map((d) => [String(d._id), d]));

    const deletedIds = beforeDocs.filter((d) => !afterMap.has(String(d._id))).map((d) => String(d._id));
    if (deletedIds.length > 0) {
      console.error(`  [VIOLATION] ${col}: ${deletedIds.length} documents deleted! IDs: ${deletedIds.slice(0, 10).join(', ')}`);
      violations += deletedIds.length;
    }

    let zeroedFields = 0;
    for (const b of beforeDocs) {
      const a = afterMap.get(String(b._id));
      if (!a) continue;
      for (const k of ['logoUrl', 'darkLogoUrl', 'reportTemplateId', 'styleId', 'viewSlug']) {
        if (b[k] && !a[k]) {
          console.error(`  [VIOLATION] ${col} ${b._id} (${b.name || b.eventName}): protected field '${k}' was wiped!`);
          violations++;
        }
      }
      if (col === 'projects' && b.stats) {
        for (const [sk, sv] of Object.entries(b.stats)) {
          if (sv && sv !== 0 && (!a.stats || a.stats[sk] === 0 || a.stats[sk] === undefined || a.stats[sk] === null)) {
            console.error(`  [VIOLATION] projects ${b._id} (${b.eventName}): stats.${sk} regressed from ${JSON.stringify(sv)} -> ${JSON.stringify(a.stats?.[sk])}`);
            zeroedFields++;
            violations++;
          }
        }
      }
    }
    console.log(`  [${violations === 0 ? 'PASS' : 'FAIL'}] ${col}: before=${beforeDocs.length}, after=${afterDocs.length}, deleted=${deletedIds.length}, zeroedStats=${zeroedFields}`);
  }
  await client.close();
  if (violations > 0) process.exit(3);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--audit-clusters')) {
    await auditClusters();
    return;
  }
  const snapIdx = args.indexOf('--snapshot');
  if (snapIdx >= 0) {
    const outIdx = args.indexOf('--out');
    await snapshotCollections(args[snapIdx + 1] || '', outIdx >= 0 ? args[outIdx + 1] : '');
    return;
  }
  const verIdx = args.indexOf('--verify');
  if (verIdx >= 0) {
    const colIdx = args.indexOf('--collections');
    await verifyAgainstBackup(args[verIdx + 1] || '', colIdx >= 0 ? args[colIdx + 1] : '');
    return;
  }
  console.log('Usage:\n  --audit-clusters\n  --snapshot col1,col2 --out /dir\n  --verify /dir --collections col1,col2');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
