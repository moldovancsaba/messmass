// tests/szrt-vision-progress.test.ts
// WHAT: The figures behind the SZRT report's audience, brand and club sections as the Fanmass deep rerun sends them.
// WHY: The owner treats an unmeasured number as prohibited content. The contract accepts only measured counts,
//     derives every share from the counts, and never writes the publication switch.

const updateOne = jest.fn().mockResolvedValue({});
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({ updateOne }) }) }),
}));
jest.mock('@/lib/config', () => ({
  __esModule: true,
  default: { dbName: 'test', fanmassIntegrationToken: 'secret-token' },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/integrations/fanmass/szrt-progress/route';
import { parseSzrtProgress, storeSzrtProgress } from '@/lib/szrtVisionProgress';

const sport = (over: Record<string, unknown> = {}) => ({
  images: 4, people: 7, genders: { male: 3, female: 1 }, ageGroups: { children: 0, teens: 1, adults: 2, seniors: 0 },
  topBrands: [{ brand: 'Quechua', count: 1 }, { brand: 'Veolia', count: 3 }], topEmotions: [{ emotion: 'happy', count: 2 }], valence: 100, ...over,
});

const body = (over: Record<string, unknown> = {}) => ({
  pipeline: 'fanmass_full_text_evidence_v1', totalImages: 11312, processedCount: 200, status: 'running', currentSport: 'Football',
  lastUpdated: '2026-11-12T12:00:00Z',
  aggregates: {
    totalPeople: 300, genders: { male: 120, female: 80 }, ageGroups: { children: 3, teens: 10, adults: 150, seniors: 12 },
    topBrands: [{ brand: 'Quechua', count: 2 }, { brand: 'Veolia', count: 9 }], topClubs: [{ club: 'DVTK', count: 5 }],
    topEmotions: [{ emotion: 'happy', count: 40 }], sportsBreakdown: { Football: sport() },
  },
  ...over,
});

describe('parseSzrtProgress', () => {
  it('accepts measured counts, sorts names by count and derives every share from the counts', () => {
    const doc = parseSzrtProgress(body());
    expect(doc.percent).toBe(1.77);
    expect(doc.aggregates.genders).toEqual({ male: 120, female: 80, malePct: 60, femalePct: 40 });
    expect(doc.aggregates.topBrands.map((b) => b.brand)).toEqual(['Veolia', 'Quechua']);
    expect(doc.aggregates.sportsBreakdown.Football).toMatchObject({ distinctBrandsCount: 2, genders: { malePct: 75, femalePct: 25 } });
  });

  it('has no default: nobody measured means zero shares and a missing valence stays null', () => {
    const empty = body();
    (empty.aggregates as Record<string, unknown>).genders = { male: 0, female: 0 };
    (empty.aggregates as { sportsBreakdown: Record<string, unknown> }).sportsBreakdown = { Football: sport({ genders: { male: 0, female: 0 }, valence: null }) };
    const doc = parseSzrtProgress(empty);
    expect(doc.aggregates.genders).toMatchObject({ malePct: 0, femalePct: 0 });
    expect(doc.aggregates.sportsBreakdown.Football.valence).toBeNull();
  });

  it('refuses what is not a measurement', () => {
    const bad = (over: Record<string, unknown>) => expect(() => parseSzrtProgress(body(over))).toThrow(expect.objectContaining({ code: 'INVALID_SZRT_PROGRESS' }));
    bad({ processedCount: 20000 });
    bad({ status: 'done' });
    bad({ lastUpdated: 'soon' });
    bad({ pipeline: '' });
    bad({ totalImages: -1 });
    bad({ aggregates: { ...body().aggregates, totalPeople: 1.5 } });
    bad({ aggregates: { ...body().aggregates, topBrands: [{ brand: '', count: 1 }] } });
    bad({ aggregates: { ...body().aggregates, sportsBreakdown: { '../x': sport() } } });
    expect(() => parseSzrtProgress(null)).toThrow(expect.objectContaining({ code: 'INVALID_SZRT_PROGRESS' }));
  });
});

describe('storeSzrtProgress', () => {
  it('replaces the figures, clears the old per-image text and never writes the publication switch', async () => {
    const update = jest.fn().mockResolvedValue({});
    await storeSzrtProgress({ collection: () => ({ updateOne: update }) }, parseSzrtProgress(body()), () => '2026-11-12T12:01:00Z');
    const [filter, change, options] = update.mock.calls[0];
    expect(filter).toEqual({ _id: 'szrt_progress' });
    expect(options).toEqual({ upsert: true });
    expect(change.$set).toMatchObject({ processedCount: 200, recentImages: [], currentFile: '', receivedAt: '2026-11-12T12:01:00Z', aggregates: { topVenues: [] } });
    expect(change.$set).not.toHaveProperty('publishApproved');
    expect(change.$setOnInsert).toEqual({ publishApproved: false });
  });
});

describe('POST /api/integrations/fanmass/szrt-progress', () => {
  const post = (payload: unknown, headers: Record<string, string> = { authorization: 'Bearer secret-token' }) =>
    POST(new NextRequest('http://localhost/api/integrations/fanmass/szrt-progress', { method: 'POST', body: JSON.stringify(payload), headers }));

  beforeEach(() => updateOne.mockClear());

  it('refuses a caller without the integration token', async () => {
    expect((await post(body(), {})).status).toBe(401);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('refuses an invalid payload with 400 and stores nothing', async () => {
    expect((await post(body({ status: 'done' }))).status).toBe(400);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('stores a valid payload', async () => {
    const response = await post(body());
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ processedCount: 200, totalImages: 11312, status: 'running' });
    expect(updateOne).toHaveBeenCalledTimes(1);
  });
});
