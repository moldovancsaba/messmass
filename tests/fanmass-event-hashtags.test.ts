// tests/fanmass-event-hashtags.test.ts
// WHAT: Fanmass adds a campaign hashtag to Messmass events: additive, once, never into an event that already carries it.

import { addEventHashtags, EVENT_HASHTAGS_CONTRACT, parseEventHashtagsRequest } from '@/lib/fanmassEventHashtags';

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
