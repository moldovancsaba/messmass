// lib/cameraLinkStats.ts
// WHAT: The scan and click counts camera measures on its tracked short links (camera#320), written onto the four event stats the reports already read:
//     visitQrCode (scans of QR codes), visitShortUrl (clicks on short links), qrscanAndroid and qrscanIphone (the device split of the QR scans).
// WHY: Camera owns the links and counts the hits; messmass owns the analytics. A stat may already hold a number (typed in, imported from a sheet), so
//     camera's total is ADDED to what the stat held when camera first reported, never written over it: stat = baseline + camera total. Camera sends
//     whole totals every time, so a repeated or late report changes nothing (idempotent) and a lost one is repaired by the next.
// HOW: Two single-document updates with an aggregation pipeline, so the baseline is read inside the database and two reports arriving together cannot
//     both take a "baseline" that already contains the other's total. The collection is a parameter so the update can be tried on a scratch collection.

import type { Collection, Document, ObjectId } from 'mongodb';

export const LINK_STAT_KEYS = ['visitQrCode', 'visitShortUrl', 'qrscanAndroid', 'qrscanIphone'] as const;
export type LinkStatKey = (typeof LINK_STAT_KEYS)[number];
export type LinkStatTotals = Record<LinkStatKey, number>;

/** No real event counts more than this; it keeps a typo from becoming a stat. */
const MAX_TOTAL = 1_000_000_000;

export type ParsedLinkStats = { ok: true; totals: LinkStatTotals } | { ok: false; error: string };

/** The totals of a request body: all four present, each a whole number from 0 to 1e9. */
export function parseLinkStatTotals(body: unknown): ParsedLinkStats {
  const raw = body && typeof body === 'object' ? (body as { totals?: unknown }).totals : undefined;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'totals must be an object' };
  const totals = {} as LinkStatTotals;
  for (const key of LINK_STAT_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > MAX_TOTAL) {
      return { ok: false, error: `${key} must be a whole number from 0 to ${MAX_TOTAL}` };
    }
    totals[key] = value;
  }
  return { ok: true, totals };
}

/**
 * Sets the four stats of one event to baseline + camera's totals. Returns false when the event does not exist.
 * First report: the baseline is what the stats hold now (0 where missing), kept on the event as `cameraLinkStats.baseline`.
 */
export async function applyLinkStats(projects: Collection<Document>, projectId: ObjectId, totals: LinkStatTotals, now: string): Promise<boolean> {
  const baseline = Object.fromEntries(LINK_STAT_KEYS.map((key) => [key, { $ifNull: [`$stats.${key}`, 0] }]));
  const zero = Object.fromEntries(LINK_STAT_KEYS.map((key) => [key, 0]));
  await projects.updateOne({ _id: projectId, cameraLinkStats: { $exists: false } }, [{ $set: { cameraLinkStats: { baseline, totals: zero } } }]);

  const stats = Object.fromEntries(LINK_STAT_KEYS.map((key) => [`stats.${key}`, { $add: [`$cameraLinkStats.baseline.${key}`, totals[key]] }]));
  const result = await projects.updateOne({ _id: projectId }, [{ $set: { 'cameraLinkStats.totals': totals, 'cameraLinkStats.updatedAt': now, ...stats } }]);
  return result.matchedCount === 1;
}
