// Remove the retired SZRT vision worker's per-image data: `szrt_vision_analysis` (brand and club lists the model
// recalled from its own prompt, free-text scene descriptions) and `szrt_vision_dlq`. Nothing serves them any more
// (`/api/interactive-report/partner-selfies` returns no analysed selfie); this deletes the data itself.
//
// Dry run by default. With --apply it first writes every document of both collections to
// backups/szrt-legacy-<timestamp>/<collection>.jsonl and deletes only after the file is written and its line count
// matches the collection count. `szrt_vision_progress` is not touched: the deep rerun replaces its figures.
//
//   npx tsx -r dotenv/config scripts/purge-szrt-legacy-vision.ts dotenv_config_path=.env.local            # counts only
//   npx tsx -r dotenv/config scripts/purge-szrt-legacy-vision.ts dotenv_config_path=.env.local --apply    # backup, then delete
//
// The database it reaches is whatever MONGODB_URI points to: use the production URI to purge production.

import fs from 'node:fs';
import path from 'node:path';
import clientPromise from '../lib/mongodb';
import config from '../lib/config';

const COLLECTIONS = ['szrt_vision_analysis', 'szrt_vision_dlq'] as const;

async function main() {
  const apply = process.argv.includes('--apply');
  const db = (await clientPromise).db(config.dbName);
  console.log(`Database: ${config.dbName}${apply ? ' (APPLY)' : ' (dry run, nothing is changed)'}`);

  const counts: Record<string, number> = {};
  for (const name of COLLECTIONS) {
    counts[name] = await db.collection(name).countDocuments({});
    console.log(`  ${name}: ${counts[name]} documents`);
  }
  if (!apply) {
    console.log('Add --apply to back up and delete them.');
    process.exit(0);
  }

  const folder = path.join(process.cwd(), 'backups', `szrt-legacy-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(folder, { recursive: true });
  for (const name of COLLECTIONS) {
    const file = path.join(folder, `${name}.jsonl`);
    const out = fs.createWriteStream(file);
    let lines = 0;
    for await (const doc of db.collection(name).find({})) {
      out.write(`${JSON.stringify(doc)}\n`);
      lines += 1;
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    if (lines !== counts[name]) {
      throw new Error(`Backup of ${name} wrote ${lines} documents but the collection had ${counts[name]}; nothing was deleted.`);
    }
    console.log(`  backed up ${lines} documents to ${file}`);
  }
  for (const name of COLLECTIONS) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    console.log(`  deleted ${deletedCount} from ${name}`);
  }
  console.log('Done. The backup folder is the only copy: keep it until you are sure.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
