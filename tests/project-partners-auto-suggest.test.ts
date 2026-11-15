// tests/project-partners-auto-suggest.test.ts
// WHAT: POST /api/admin/project-partners/auto-suggest picks only events with no home partner in either field and writes
//     the current partner1Id / partner2Id next to the legacy partner1 / partner2.
// WHY: It used to select on partner1 only (so events that already had partner1Id were rewritten) and wrote only the
//     legacy fields the hero, the editor and isHomeGame never read (drift register entry 83, messmass#430).

import { ObjectId } from 'mongodb';

const home = { _id: new ObjectId(), name: 'Ferencvárosi TC' };
const away = { _id: new ObjectId(), name: 'Újpest FC' };
const finds: unknown[] = [];
const updates: Array<{ filter: unknown; update: Record<string, Record<string, unknown>> }> = [];
const eventId = new ObjectId();

jest.mock('@/lib/apiGuards', () => ({ __esModule: true, requireSession: async () => null }));
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) => ({
      find: (filter: unknown) => {
        if (name === 'projects') finds.push(filter);
        return { toArray: async () => (name === 'partners' ? [home, away] : [{ _id: eventId, eventName: 'Ferencvárosi TC x Újpest FC' }]) };
      },
      updateOne: async (filter: unknown, update: Record<string, Record<string, unknown>>) => {
        updates.push({ filter, update });
        return { modifiedCount: 1 };
      },
    }),
  }),
}));

import { POST } from '@/app/api/admin/project-partners/auto-suggest/route';

test('selects events with no partner in either field and writes the current and legacy fields', async () => {
  const res = await POST();
  expect((await res.json()).updated).toBe(1);
  expect(finds[0]).toEqual({
    $and: [
      { $or: [{ partner1Id: null }, { partner1Id: { $exists: false } }] },
      { $or: [{ partner1: null }, { partner1: { $exists: false } }] },
    ],
  });
  expect(updates[0].update.$set).toEqual({ partner1: home._id, partner1Id: home._id, partner2: away._id, partner2Id: away._id });
});
