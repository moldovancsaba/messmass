// tests/camera-link-stats-route.test.ts
// WHAT: POST /api/integrations/camera/events/[messmassEventId]/link-stats is behind the camera shared secret, answers 400 for a malformed id or bad
//     totals, 404 for an unknown event, and 200 with the totals otherwise.

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const known = new ObjectId();
const writes: unknown[] = [];

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return { __esModule: true, default: { ...actual.default, cameraProvisionToken: 'test-secret' } };
});
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: () => ({
      updateOne: async (filter: Record<string, unknown>, update: unknown) => {
        writes.push(update);
        return { matchedCount: String(filter._id) === String(known) ? 1 : 0 };
      },
    }),
  }),
  default: async () => ({}),
}));

import { POST } from '@/app/api/integrations/camera/events/[messmassEventId]/link-stats/route';

const totals = { visitQrCode: 4, visitShortUrl: 1, qrscanAndroid: 3, qrscanIphone: 1 };
const call = (id: string, body: unknown, headers: Record<string, string> = {}) =>
  POST(new NextRequest(`http://localhost/api/integrations/camera/events/${id}/link-stats`, { method: 'POST', body: JSON.stringify(body), headers }), {
    params: Promise.resolve({ messmassEventId: id }),
  });

beforeEach(() => { writes.length = 0; });

test('without the camera secret the answer is 401 and nothing is written', async () => {
  expect((await call(String(known), { totals })).status).toBe(401);
  expect((await call(String(known), { totals }, { 'x-camera-secret': 'wrong' })).status).toBe(401);
  expect(writes).toHaveLength(0);
});

test('a malformed id is 400, bad totals are 400, an unknown event is 404, nothing is written for the first two', async () => {
  const headers = { 'x-camera-secret': 'test-secret' };
  expect((await call('nope', { totals }, headers)).status).toBe(400);
  const bad = await call(String(known), { totals: { ...totals, visitQrCode: -1 } }, headers);
  expect(bad.status).toBe(400);
  expect((await bad.json()).error).toBe('invalid_totals');
  expect(writes).toHaveLength(0);
  expect((await call(String(new ObjectId()), { totals }, headers)).status).toBe(404);
});

test('with the secret and good totals the event is updated and the totals come back', async () => {
  const res = await call(String(known), { totals }, { authorization: 'Bearer test-secret' });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true, totals });
  expect(writes).toHaveLength(2);
});
