// lib/variableMerge.ts
//
// WHAT: Compute variable-merge candidates and apply approved merges over the
//     event `stats` map. Backs the /admin/kyc merge console.
// WHY: The variable audit (docs/_audit/variable-audit.md) found ~244 stat
//     variables with casing dupes, word-order dupes, and report/data name
//     mismatches that block cross-event analytics. Operators approve merges in
//     the UI; this module detects candidates and applies them safely.
// HOW: Detection is structural (casing fold + sorted-token signature) plus a
//     curated seed for semantic families. Application is dry-run-first, backs up
//     every touched field, and is idempotent.

import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export const MIGRATION_BACKUP_COLLECTION = 'variable_migration_backup';

export type MergeKind = 'casing' | 'token-reorder' | 'name-mismatch';
export type ConflictRule = 'copy' | 'sum' | 'prefer-canonical';

export interface MergeCandidate {
  id: string;
  canonical: string;
  legacy: string[];
  kind: MergeKind;
  counts: { canonicalOnly: number; legacyOnly: number; both: number; conflict: number };
  usedInReports: string[];
  recommendation: { rule: ConflictRule; safe: boolean; note: string };
}

export interface MergeRequestItem {
  canonical: string;
  legacy: string[];
  rule: ConflictRule;
}

// Curated semantic families the audit found (not structurally detectable).
// canonical is the name reports SHOULD use; legacy names fold into it.
const SEED_FAMILIES: Array<{ canonical: string; legacy: string[] }> = [
  { canonical: 'visitFacebook', legacy: ['ventFacebook'] },
  { canonical: 'visitInstagram', legacy: ['ventInstagram'] },
  { canonical: 'directUrl', legacy: ['ventUrl'] },
  { canonical: 'visitQrCode', legacy: ['ventQr'] },
  { canonical: 'baseballCap', legacy: ['Caps'] },
];

export function tokens(name: string): string {
  // split camelCase / snake_case into a sorted lowercase token signature so
  // "totalBitlyClicks" and "bitlyTotalClicks" collapse to the same signature.
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_.]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

function isFilled(v: unknown): boolean {
  return v !== undefined && v !== null && v !== '';
}

function numeric(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

/**
 * Scan events + report/chart references and return merge candidates.
 * Read-only.
 */
export async function computeMergeCandidates(db: Db): Promise<MergeCandidate[]> {
  const projects = await db
    .collection('projects')
    .find({}, { projection: { stats: 1 } })
    .toArray();

  const keyEvents = new Map<string, Set<string>>(); // var -> set of project ids
  for (const p of projects) {
    const id = String(p._id);
    for (const k of Object.keys(p.stats || {})) {
      if (!keyEvents.has(k)) keyEvents.set(k, new Set());
      keyEvents.get(k)!.add(id);
    }
  }
  const keys = [...keyEvents.keys()];

  // which variable names are referenced by any chart/report/template
  const refCols = ['chart_configurations', 'charts', 'report_templates', 'report_variants', 'reports', 'reports_v12'];
  const usedInReports = new Set<string>();
  for (const col of refCols) {
    const docs = await db.collection(col).find({}).toArray().catch(() => []);
    for (const doc of docs) {
      for (const m of JSON.stringify(doc).matchAll(/\[([a-zA-Z][a-zA-Z0-9_.]+)\]/g)) usedInReports.add(m[1]);
    }
  }

  // group structurally: casing fold + token signature
  const casing = new Map<string, string[]>();
  const tokenSig = new Map<string, string[]>();
  for (const k of keys) {
    const lc = k.toLowerCase();
    (casing.get(lc) ?? casing.set(lc, []).get(lc)!).push(k);
    const sig = tokens(k);
    (tokenSig.get(sig) ?? tokenSig.set(sig, []).get(sig)!).push(k);
  }

  const seen = new Set<string>();
  const candidates: MergeCandidate[] = [];

  const pushGroup = (members: string[], kind: MergeKind, forcedCanonical?: string) => {
    const uniq = [...new Set(members)].filter((m) => keyEvents.has(m));
    if (uniq.length < 2) return;
    const sig = uniq.slice().sort().join('|');
    if (seen.has(sig)) return;
    seen.add(sig);

    // canonical: forced, else the one used in reports, else most events
    const canonical =
      forcedCanonical && uniq.includes(forcedCanonical)
        ? forcedCanonical
        : uniq.find((m) => usedInReports.has(m)) ??
          uniq.slice().sort((a, b) => keyEvents.get(b)!.size - keyEvents.get(a)!.size)[0];
    const legacy = uniq.filter((m) => m !== canonical);

    // conflict analysis across events
    const canonSet = keyEvents.get(canonical)!;
    let both = 0;
    let conflict = 0;
    let legacyOnly = 0;
    const legacySets = legacy.map((l) => keyEvents.get(l)!);
    const allLegacy = new Set<string>();
    legacySets.forEach((s) => s.forEach((id) => allLegacy.add(id)));
    for (const id of allLegacy) {
      if (canonSet.has(id)) both++;
      else legacyOnly++;
    }
    // conflict = both present with differing values (sampled from projects)
    for (const p of projects) {
      const id = String(p._id);
      if (!allLegacy.has(id) || !canonSet.has(id)) continue;
      const s = p.stats || {};
      const cv = String(s[canonical]);
      if (legacy.some((l) => isFilled(s[l]) && String(s[l]) !== cv)) conflict++;
    }
    const canonicalOnly = canonSet.size - both;

    const safe = conflict === 0;
    const rule: ConflictRule = safe ? 'copy' : 'prefer-canonical';
    const note = safe
      ? legacyOnly > 0
        ? `Fills ${legacyOnly} event(s) that only have the legacy name; ${both} already match. No conflicts.`
        : `Legacy fully redundant with the canonical (${both} identical). Safe to drop.`
      : `${conflict} event(s) hold different values under both names — review before applying.`;

    candidates.push({
      id: canonical,
      canonical,
      legacy,
      kind,
      counts: { canonicalOnly, legacyOnly, both, conflict },
      usedInReports: uniq.filter((m) => usedInReports.has(m)),
      recommendation: { rule, safe, note },
    });
  };

  for (const [, members] of casing) pushGroup(members, 'casing');
  for (const [, members] of tokenSig) pushGroup(members, 'token-reorder');
  for (const fam of SEED_FAMILIES) pushGroup([fam.canonical, ...fam.legacy], 'name-mismatch', fam.canonical);

  // sort: safe + high-impact first
  candidates.sort((a, b) => {
    if (a.recommendation.safe !== b.recommendation.safe) return a.recommendation.safe ? -1 : 1;
    return b.counts.legacyOnly - a.counts.legacyOnly;
  });
  return candidates;
}

export interface MergeResult {
  dryRun: boolean;
  applied: number;
  changes: Array<{ canonical: string; legacy: string[]; rule: ConflictRule; eventsTouched: number }>;
  conflicts: Array<{ projectId: string; canonical: string; legacy: string; canonicalValue: unknown; legacyValue: unknown }>;
}

/**
 * Apply approved merges. Dry-run by default. Backs up every touched field to
 * MIGRATION_BACKUP_COLLECTION before mutating, and is idempotent.
 */
export async function applyMerges(
  db: Db,
  merges: MergeRequestItem[],
  opts: { dryRun: boolean; actor?: string },
): Promise<MergeResult> {
  const result: MergeResult = { dryRun: opts.dryRun, applied: 0, changes: [], conflicts: [] };
  const projects = await db.collection('projects').find({}).toArray();
  const now = new Date().toISOString();

  for (const merge of merges) {
    const { canonical, legacy, rule } = merge;
    let eventsTouched = 0;

    for (const p of projects) {
      const s = (p.stats || {}) as Record<string, unknown>;
      const legacyPresent = legacy.filter((l) => isFilled(s[l]));
      if (legacyPresent.length === 0) continue;

      const hasCanon = isFilled(s[canonical]);
      // record conflicts (both present, differing) for the review file
      for (const l of legacyPresent) {
        if (hasCanon && String(s[l]) !== String(s[canonical])) {
          result.conflicts.push({
            projectId: String(p._id),
            canonical,
            legacy: l,
            canonicalValue: s[canonical],
            legacyValue: s[l],
          });
        }
      }

      // compute the new canonical value
      let newValue: unknown;
      if (rule === 'sum') {
        const parts = [numeric(s[canonical]) ?? 0, ...legacyPresent.map((l) => numeric(s[l]) ?? 0)];
        newValue = parts.reduce((a, b) => a + b, 0);
      } else if (rule === 'prefer-canonical') {
        newValue = hasCanon ? s[canonical] : s[legacyPresent[0]];
      } else {
        // copy: only fill when canonical is empty
        newValue = hasCanon ? s[canonical] : s[legacyPresent[0]];
      }

      // idempotent: nothing to do if canonical already equals target and no legacy keys remain
      const alreadyDone = hasCanon && String(s[canonical]) === String(newValue) && legacyPresent.length === 0;
      if (alreadyDone) continue;

      eventsTouched++;
      if (opts.dryRun) continue;

      // backup the fields we are about to change
      const backup: Record<string, unknown> = { canonical: s[canonical] };
      for (const l of legacy) backup[l] = s[l];
      await db.collection(MIGRATION_BACKUP_COLLECTION).insertOne({
        projectId: new ObjectId(p._id),
        canonical,
        legacy,
        rule,
        before: backup,
        after: newValue,
        actor: opts.actor || 'unknown',
        at: now,
      });

      const setOps: Record<string, unknown> = { [`stats.${canonical}`]: newValue };
      const unsetOps: Record<string, ''> = {};
      for (const l of legacy) unsetOps[`stats.${l}`] = '';
      await db.collection('projects').updateOne({ _id: p._id }, { $set: setOps, $unset: unsetOps });
    }

    result.changes.push({ canonical, legacy, rule, eventsTouched });
    if (!opts.dryRun) result.applied += eventsTouched;
  }

  return result;
}
