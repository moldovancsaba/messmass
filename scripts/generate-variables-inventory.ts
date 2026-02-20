/**
 * Variables inventory generation and diff report (OPS-VAR-01)
 *
 * WHAT: Dump current variables from /api/variables-config source (variables_metadata) to JSON + CSV; diff vs previous run.
 * WHY: Nightly inventory and change visibility for variables system hygiene.
 * HOW: Run with tsx; optional OUT_DIR env. Cron: 0 2 * * * (e.g. 2 AM) or npm run variables:inventory
 *
 * Usage:
 *   npx tsx -r dotenv/config scripts/generate-variables-inventory.ts dotenv_config_path=.env.local
 *   OUT_DIR=docs/operations/variables-inventory npx tsx ...
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDb, getClient } from '../lib/db';

const COLLECTION = 'variables_metadata';
const OUT_DIR = process.env.OUT_DIR || path.join(process.cwd(), 'docs/operations/variables-inventory');
const SNAPSHOT_LATEST = 'latest.json';
const DIFF_REPORT = 'diff-report.txt';

type VariableRow = {
  name: string;
  label?: string;
  type?: string;
  category?: string;
  isSystem?: boolean;
  derived?: boolean;
  order?: number;
  updatedAt?: string;
};

function escapeCsv(s: string): string {
  const str = String(s ?? '');
  return /[,\n"]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function snapshotToCsv(vars: VariableRow[]): string {
  const headers = ['name', 'label', 'type', 'category', 'isSystem', 'derived', 'order', 'updatedAt'];
  const rows = vars.map((v) =>
    headers.map((h) => escapeCsv((v as Record<string, unknown>)[h] as string)).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function diff(prev: VariableRow[], curr: VariableRow[]): { added: string[]; removed: string[]; changed: string[] } {
  const prevMap = new Map(prev.map((v) => [v.name, v]));
  const currMap = new Map(curr.map((v) => [v.name, v]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const name of currMap.keys()) {
    if (!prevMap.has(name)) added.push(name);
    else {
      const p = prevMap.get(name)!;
      const c = currMap.get(name)!;
      if (
        (p.label ?? '') !== (c.label ?? '') ||
        (p.type ?? '') !== (c.type ?? '') ||
        (p.category ?? '') !== (c.category ?? '')
      ) {
        changed.push(name);
      }
    }
  }
  for (const name of prevMap.keys()) {
    if (!currMap.has(name)) removed.push(name);
  }

  return { added, removed, changed };
}

async function main() {
  const db = await getDb();
  const raw = await db
    .collection(COLLECTION)
    .find({})
    .sort({ category: 1, order: 1, name: 1 })
    .toArray();

  const variables: VariableRow[] = (raw as any[]).map((v) => ({
    name: v.name ?? '',
    label: v.label ?? v.alias ?? '',
    type: v.type ?? '',
    category: v.category ?? '',
    isSystem: !!v.isSystem,
    derived: !!v.derived,
    order: typeof v.order === 'number' ? v.order : undefined,
    updatedAt: v.updatedAt,
  }));

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const date = new Date().toISOString().slice(0, 10);
  const snapshotPath = path.join(OUT_DIR, `inventory-${date}.json`);
  const latestPath = path.join(OUT_DIR, SNAPSHOT_LATEST);
  const csvPath = path.join(OUT_DIR, `inventory-${date}.csv`);
  const diffPath = path.join(OUT_DIR, DIFF_REPORT);

  let previous: VariableRow[] = [];
  try {
    const prevJson = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    if (prevJson.variables && Array.isArray(prevJson.variables)) {
      previous = prevJson.variables as VariableRow[];
    }
  } catch {
    // no previous snapshot
  }

  fs.writeFileSync(snapshotPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: variables.length, variables }, null, 2), 'utf-8');
  fs.writeFileSync(latestPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: variables.length, variables }, null, 2), 'utf-8');
  fs.writeFileSync(csvPath, snapshotToCsv(variables), 'utf-8');

  const { added, removed, changed } = diff(previous, variables);

  const diffLines = [
    `Variables inventory diff – ${new Date().toISOString()}`,
    `Previous: ${previous.length} | Current: ${variables.length}`,
    '',
    'Added: ' + (added.length ? added.join(', ') : 'none'),
    'Removed: ' + (removed.length ? removed.join(', ') : 'none'),
    'Changed (label/type/category): ' + (changed.length ? changed.join(', ') : 'none'),
  ];
  fs.writeFileSync(diffPath, diffLines.join('\n'), 'utf-8');

  console.log(`Variables inventory: ${variables.length} variables`);
  console.log(`Written: ${snapshotPath}, ${csvPath}, ${latestPath}, ${diffPath}`);
  console.log(`Diff: +${added.length} -${removed.length} ~${changed.length}`);

  const client = await getClient();
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
