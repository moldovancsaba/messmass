// tests/camera-link-stats.test.ts
// WHAT: parseLinkStatTotals accepts exactly four whole, non-negative totals; applyLinkStats keeps the baseline once and sets stat = baseline + total
//     with two pipeline updates (the database does the arithmetic, so the shape of the update is what is checked here; the arithmetic itself was run
//     on a scratch collection, see docs/architecture.md "Camera integration").

import { ObjectId } from 'mongodb';
import { applyLinkStats, LINK_STAT_KEYS, parseLinkStatTotals } from '@/lib/cameraLinkStats';

const good = { visitQrCode: 12, visitShortUrl: 3, qrscanAndroid: 7, qrscanIphone: 5 };

test('four whole non-negative totals are accepted', () => {
  expect(parseLinkStatTotals({ totals: good })).toEqual({ ok: true, totals: good });
  expect(parseLinkStatTotals({ totals: { ...good, visitQrCode: 0 } }).ok).toBe(true);
});

test('anything else is refused with the name of the first bad total', () => {
  for (const body of [null, 'x', {}, { totals: null }, { totals: [] }, { totals: 5 }]) expect(parseLinkStatTotals(body).ok).toBe(false);
  for (const key of LINK_STAT_KEYS) {
    const missing: Record<string, number> = { ...good };
    delete missing[key];
    expect(parseLinkStatTotals({ totals: missing })).toEqual({ ok: false, error: expect.stringContaining(key) });
    for (const bad of [-1, 1.5, '3', NaN, Infinity, null, 1_000_000_001]) {
      expect(parseLinkStatTotals({ totals: { ...good, [key]: bad } }).ok).toBe(false);
    }
  }
});

test('the baseline is taken once inside the database and the stats are baseline plus the total', async () => {
  const calls: Array<{ filter: Record<string, unknown>; update: Array<{ $set: Record<string, unknown> }> }> = [];
  const projects = {
    updateOne: async (filter: Record<string, unknown>, update: Array<{ $set: Record<string, unknown> }>) => {
      calls.push({ filter, update });
      return { matchedCount: 1 };
    },
  };
  const id = new ObjectId();
  const found = await applyLinkStats(projects as never, id, good, '2026-10-07T12:00:00.000Z');
  expect(found).toBe(true);
  expect(calls).toHaveLength(2);

  const [first, second] = calls;
  expect(first.filter).toEqual({ _id: id, cameraLinkStats: { $exists: false } });
  const kept = first.update[0].$set.cameraLinkStats as { baseline: Record<string, unknown>; totals: Record<string, number> };
  expect(kept.baseline.visitQrCode).toEqual({ $ifNull: ['$stats.visitQrCode', 0] });
  expect(Object.values(kept.totals)).toEqual([0, 0, 0, 0]);

  expect(second.filter).toEqual({ _id: id });
  const set = second.update[0].$set;
  expect(set['cameraLinkStats.totals']).toEqual(good);
  expect(set['cameraLinkStats.updatedAt']).toBe('2026-10-07T12:00:00.000Z');
  for (const key of LINK_STAT_KEYS) expect(set[`stats.${key}`]).toEqual({ $add: [`$cameraLinkStats.baseline.${key}`, good[key]] });
});

test('an event that does not exist is reported as not found', async () => {
  const projects = { updateOne: async () => ({ matchedCount: 0 }) };
  expect(await applyLinkStats(projects as never, new ObjectId(), good, 'now')).toBe(false);
});
