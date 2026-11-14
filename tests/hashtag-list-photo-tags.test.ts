// tests/hashtag-list-photo-tags.test.ts
// WHAT: GET /api/hashtags?photos=1 lists the hashtags Fanmass wrote onto photos next to the event hashtags.
// WHY: Owner 2026-11-14: the hashtags agreed for the images (emotion, brand, sport, event, club, people) must be
//     selectable in the admin hashtag filter; without photos=1 (the event editor) the list stays events only.

const aggregate = jest.fn();

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: (name: string) => ({ aggregate: (p: unknown[]) => ({ toArray: async () => aggregate(name, p) }) }) }) }),
}));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));
jest.mock('@/lib/apiGuards', () => ({ requireAdmin: jest.fn(), requireEditorAccess: jest.fn() }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/hashtags/route';

beforeEach(() => {
  aggregate.mockReset();
  aggregate.mockImplementation(async (name: string, pipeline: Array<Record<string, any>>) => {
    if (pipeline.some((stage) => '$count' in stage)) return [{ total: 1 }];
    if (name === 'projects') return [{ _id: 'TippmixReport2026', count: 206 }];
    if (name === 'fanmass_event_drive_photos') return [{ _id: 'tippmixreport2026', count: 11312 }, { _id: 'happy', count: 2093 }];
    return [{ _id: 'happy', count: 40 }];
  });
});

it('merges event and photo hashtags, case-insensitively, with both counts', async () => {
  const res = await GET(new NextRequest('http://x/api/hashtags?photos=1&limit=10'));
  const body = await res.json();
  expect(body.hashtags).toEqual([
    { hashtag: 'TippmixReport2026', count: 206, photos: 11312 },
    { hashtag: 'happy', count: 0, photos: 2133 },
  ]);
  expect(body.pagination).toMatchObject({ totalMatched: 2, nextOffset: null });
});

it('lists event hashtags only without photos=1', async () => {
  await GET(new NextRequest('http://x/api/hashtags?limit=10'));
  expect(aggregate.mock.calls.every(([name]) => name === 'projects')).toBe(true);
});
