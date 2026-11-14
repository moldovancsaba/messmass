// tests/fanmass-event-hashtags.test.ts
// WHAT: Fanmass adds a campaign hashtag to Messmass events: additive, once, never into an event that already carries it.

import { addEventHashtags, EVENT_HASHTAGS_CONTRACT, parseEventHashtagsRequest, refreshFanmassHashtags } from '@/lib/fanmassEventHashtags';

const A = '6af861d294eb1bfcaaca5622';
const B = '6af861d494eb1bfcaaca5623';
const C = '6af861d794eb1bfcaaca5624';
const D = '6af861da94eb1bfcaaca5626';
const E = '6af861cf94eb1bfcaaca5621';

describe('the request', () => {
  it('reads hashtags in hashtag form and unique event ids', () => {
    expect(parseEventHashtagsRequest({ contractVersion: EVENT_HASHTAGS_CONTRACT, hashtags: ['#TippmixReport2026'], eventIds: [A, A] }))
      .toEqual({ hashtags: ['tippmixreport2026'], eventIds: [A] });
  });

  it.each([
    ['another contract', { contractVersion: 'x', hashtags: ['a'], eventIds: [A] }],
    ['no hashtag', { contractVersion: EVENT_HASHTAGS_CONTRACT, hashtags: [], eventIds: [A] }],
    ['a hashtag with spaces', { contractVersion: EVENT_HASHTAGS_CONTRACT, hashtags: ['tipp mix'], eventIds: [A] }],
    ['an id that is not an event id', { contractVersion: EVENT_HASHTAGS_CONTRACT, hashtags: ['a'], eventIds: ['abc'] }],
  ])('refuses %s', (_label, body) => {
    expect(() => parseEventHashtagsRequest(body)).toThrow();
  });
});

describe('adding', () => {
  it('adds only what an event does not carry yet, in any list or case, and never touches the rest', async () => {
    const updates: Array<[unknown, any]> = [];
    const docs = [
      { _id: A, hashtags: ['paks', 'football'] },
      { _id: B, hashtags: ['sopron'], categorizedHashtags: { campaign: ['TIPPMIXREPORT2026'] } },
      { _id: C, hashtags: 'old, comma, text' },
      { _id: D },
    ];
    const db = {
      collection: () => ({
        find: () => ({ toArray: async () => docs.map((d) => ({ ...d, _id: { toString: () => d._id } })) }),
        updateOne: async (filter: unknown, update: any) => { updates.push([filter, update]); },
      }),
    } as any;
    const result = await addEventHashtags(db, { hashtags: ['tippmixreport2026'], eventIds: [A, B, C, D, E] }, new Date('2026-11-14T00:00:00Z'));
    expect(result).toEqual({
      added: [{ eventId: A, hashtags: ['tippmixreport2026'] }, { eventId: D, hashtags: ['tippmixreport2026'] }],
      unchanged: [B],
      missing: [E],
      skipped: [C],
    });
    expect(updates).toHaveLength(2);
    expect(updates[0][1]).toEqual({ $addToSet: { hashtags: { $each: ['tippmixreport2026'] } }, $set: { updatedAt: '2026-11-14T00:00:00.000Z' } });
  });
});

describe('the Fanmass hashtags of an event', () => {
  it('are its photos\' hashtags without its typed ones, kept apart from them, and cleared when its photos left', async () => {
    const sets: Array<[string, any]> = [];
    let unset: any = null;
    const events = [
      { _id: { toString: () => A }, hashtags: ['paks', 'football'], categorizedHashtags: { campaign: ['TippmixReport2026'] } },
      { _id: { toString: () => B }, hashtags: ['sopron'], fanmassHashtags: ['happy'] },
    ];
    const db = {
      collection: (name: string) => ({
        aggregate: () => ({ toArray: async () => (name === 'fanmass_event_drive_photos'
          ? [{ _id: A, tags: ['paks', 'tippmixreport2026', 'happy', 'mvm'] }, { _id: B, tags: ['happy'] }, { _id: 'not-an-event', tags: ['x'] }]
          : [{ _id: A, tags: ['Male', 'happy'] }]) }),
        find: () => ({ toArray: async () => events }),
        updateOne: async (filter: any, update: any) => { sets.push([String(filter._id), update.$set.fanmassHashtags]); },
        updateMany: async (filter: any, update: any) => { unset = { filter, update }; return { modifiedCount: 2 }; },
      }),
    } as any;
    const result = await refreshFanmassHashtags(db, new Date('2026-11-14T00:00:00Z'));
    // A: typed paks and tippmixreport2026 (in a category list, any case) stay out; drive and Camera photo tags merge
    expect(sets).toEqual([[A, ['happy', 'male', 'mvm']]]);
    // B: unchanged, so not written again
    expect(result).toEqual({ events: 2, changed: 1, cleared: 2 });
    expect(unset.update).toEqual({ $unset: { fanmassHashtags: '', fanmassHashtagsAt: '' } });
  });
});
