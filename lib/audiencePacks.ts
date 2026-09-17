// lib/audiencePacks.ts
// WHAT: Audience packs -- named, block-level visibility presets for a report
//     -- messmass#236, Phase A.
// WHY: Per the decisions made 2026-09-17: four presets (sponsor/agency merged
//     as one tier, executive, board, operator), governance model B (each
//     preset lists which blocks it includes, not per-content sensitivity
//     tagging -- simpler to ship, no new field touching every existing data
//     block/chart). No `audience`, `visibility`, or `sensitivity` concept
//     existed anywhere in this codebase before this (checked, not assumed,
//     in the original scoping audit).
// HOW: A pack is an explicit ALLOWLIST of data_blocks._id values. Every pack
//     starts empty -- nothing is pre-exposed by a guessed default; an admin
//     adds blocks to a pack intentionally. Filtering is applied only when a
//     caller explicitly asks for a pack view (see app/api/reports/resolve),
//     so every existing report, page, and integration is completely
//     unaffected unless it opts in. This is a new, additive dimension
//     alongside owner and time-period on the existing report_variants
//     reuse story (see the #236 audit comment) -- Phase A ships the pack
//     model and the filter itself; wiring a pack onto a specific variant is
//     the next, smaller step once this is in place.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { Report } from '@/lib/report-resolver';

export const AUDIENCE_PACK_KEYS = ['sponsor', 'executive', 'board', 'operator'] as const;
export type AudiencePackKey = (typeof AUDIENCE_PACK_KEYS)[number];

export interface AudiencePack {
  _id: ObjectId;
  key: AudiencePackKey;
  name: string;
  description?: string;
  allowedBlockIds: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PACK_NAMES: Record<AudiencePackKey, string> = {
  sponsor: 'Sponsor / Agency',
  executive: 'Executive',
  board: 'Board',
  operator: 'Operator',
};

async function getCollection() {
  const client = await clientPromise;
  return client.db(config.dbName).collection<AudiencePack>('audience_packs');
}

/** Idempotent -- upserts the four packs with an empty allowlist if they don't already exist. Never overwrites an existing pack's allowlist. */
export async function seedAudiencePacks(): Promise<number> {
  const collection = await getCollection();
  const now = new Date().toISOString();
  let created = 0;
  for (const key of AUDIENCE_PACK_KEYS) {
    const existing = await collection.findOne({ key });
    if (existing) continue;
    await collection.insertOne({
      key,
      name: DEFAULT_PACK_NAMES[key],
      allowedBlockIds: [],
      createdAt: now,
      updatedAt: now,
    } as Omit<AudiencePack, '_id'> as AudiencePack);
    created += 1;
  }
  return created;
}

export async function listAudiencePacks(): Promise<AudiencePack[]> {
  const collection = await getCollection();
  return collection.find({}).sort({ key: 1 }).toArray();
}

export async function getAudiencePack(key: string): Promise<AudiencePack | null> {
  if (!AUDIENCE_PACK_KEYS.includes(key as AudiencePackKey)) return null;
  const collection = await getCollection();
  return collection.findOne({ key: key as AudiencePackKey });
}

export async function setAudiencePackBlocks(key: string, allowedBlockIds: string[]): Promise<AudiencePack | null> {
  if (!AUDIENCE_PACK_KEYS.includes(key as AudiencePackKey)) return null;
  const collection = await getCollection();
  const now = new Date().toISOString();
  await collection.updateOne(
    { key: key as AudiencePackKey },
    { $set: { allowedBlockIds, updatedAt: now }, $setOnInsert: { name: DEFAULT_PACK_NAMES[key as AudiencePackKey], createdAt: now } },
    { upsert: true }
  );
  return getAudiencePack(key);
}

/**
 * WHAT: Filters a resolved report's blocks down to a pack's allowlist. Pure.
 * WHY: A pack with an empty allowlist hides everything rather than showing
 *     everything -- least-privilege by construction, since an admin who
 *     hasn't configured a pack yet should not accidentally expose a full
 *     report through it.
 */
export function filterReportByAudiencePack(report: Report, pack: AudiencePack | null): Report {
  if (!pack) return report;
  return {
    ...report,
    layout: {
      ...report.layout,
      blocks: report.layout.blocks.filter((block) => pack.allowedBlockIds.includes(block.id)),
    },
  };
}
