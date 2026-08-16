// tests/ai-analytics.test.ts
// WHAT: Unit coverage for the AI analytics read model's pure logic.
// WHY: Status derivation, staleness and the AI-variable predicate are the rules
//     every downstream surface depends on. Getting "unknown is not stale" or
//     "empty is not complete" wrong would mislead exactly the report authors this
//     workspace exists to help.

// Prevent lib/mongodb.ts (eager MongoClient.connect() at import) from opening a
// real connection that never closes -> jest hangs. aiAnalytics imports getDb
// transitively; this suite only exercises its pure logic.
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}));

import { deriveEventStatus, isAiVariableName, isStale, STALE_AFTER_HOURS } from '@/lib/aiAnalytics';

describe('isAiVariableName', () => {
  it('matches AI-owned variables', () => {
    expect(isAiVariableName('fanmassPeople')).toBe(true);
    expect(isAiVariableName('fanmassMerchCap')).toBe(true);
  });

  it('rejects everything else, including near-misses', () => {
    expect(isAiVariableName('remoteImages')).toBe(false);
    expect(isAiVariableName('FanmassPeople')).toBe(false); // case-sensitive by design
    expect(isAiVariableName('myFanmassThing')).toBe(false); // prefix, not substring
    expect(isAiVariableName('')).toBe(false);
  });
});

describe('isStale', () => {
  const now = Date.parse('2026-08-14T12:00:00.000Z');

  it('treats unknown as not stale', () => {
    // The estate carries events analysed before freshness was recorded. Flagging
    // them all would train operators to ignore the signal.
    expect(isStale(null, now)).toBe(false);
  });

  it('treats an unparseable stamp as not stale rather than guessing', () => {
    expect(isStale('not-a-date', now)).toBe(false);
  });

  it('is fresh inside the threshold and stale outside it', () => {
    const oneHourAgo = new Date(now - 3600_000).toISOString();
    const wayBack = new Date(now - (STALE_AFTER_HOURS + 1) * 3600_000).toISOString();
    expect(isStale(oneHourAgo, now)).toBe(false);
    expect(isStale(wayBack, now)).toBe(true);
  });

  it('does not flag exactly at the threshold', () => {
    const exactly = new Date(now - STALE_AFTER_HOURS * 3600_000).toISOString();
    expect(isStale(exactly, now)).toBe(false);
  });
});

describe('deriveEventStatus', () => {
  it('reports not_connected when no AI variable is present', () => {
    const result = deriveEventStatus({ remoteImages: 12, fans: 300 });
    expect(result.status).toBe('not_connected');
    expect(result.progressPercent).toBeNull();
  });

  it('uses the producer figure when present', () => {
    const result = deriveEventStatus({ fanmassStatus: 40, fanmassImages: 386, fanmassAnalyzedImages: 154 });
    expect(result.status).toBe('analyzing');
    expect(result.progressPercent).toBe(40);
  });

  it('reports complete only at full analysis', () => {
    expect(deriveEventStatus({ fanmassStatus: 100 }).status).toBe('complete');
    expect(deriveEventStatus({ fanmassStatus: 99.9 }).status).toBe('analyzing');
  });

  it('falls back to counts for events pushed before fanmassStatus existed', () => {
    const result = deriveEventStatus({ fanmassImages: 10, fanmassAnalyzedImages: 5 });
    expect(result.progressPercent).toBe(50);
    expect(result.status).toBe('analyzing');
  });

  it('reports no_images for a connected event with zero discovered images', () => {
    // Camera-provisioned event, nothing uploaded yet: not "analysing" (nothing
    // is running) and not "complete" (nothing has happened) — its own status.
    const result = deriveEventStatus({ fanmassImages: 0, fanmassAnalyzedImages: 0 });
    expect(result.status).toBe('no_images');
    expect(result.progressPercent).toBeNull();
    expect(result.imagesDiscovered).toBe(0);
  });

  it('does not treat a missing image count the same as an explicit zero', () => {
    // fanmassImages never reported (vs. reported as 0): still "analysing",
    // waiting on a count, not "no images".
    const result = deriveEventStatus({ fanmassStatus: 0 });
    expect(result.status).toBe('analyzing');
  });

  it('surfaces the image counts it used', () => {
    const result = deriveEventStatus({ fanmassImages: 411, fanmassAnalyzedImages: 411, fanmassStatus: 100 });
    expect(result.imagesDiscovered).toBe(411);
    expect(result.imagesAnalyzed).toBe(411);
  });
});
