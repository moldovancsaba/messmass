// tests/camera-frame-context-route.test.ts
// WHAT: GET /api/integrations/camera/events/[messmassEventId]/frame-context is behind the camera shared secret,
//     answers 400 for a malformed id, 404 for an unknown event, and the resolved context otherwise.

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const project = { _id: new ObjectId(), eventName: 'Fan Day', eventDate: '2026-10-12' };

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return { __esModule: true, default: { ...actual.default, cameraProvisionToken: 'test-secret' } };
});
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (filter: Record<string, unknown>) => (name === 'projects' && String(filter._id) === String(project._id) ? project : null),
      find: () => ({ toArray: async () => [] }),
    }),
  }),
  default: async () => ({}),
}));

import { GET } from '@/app/api/integrations/camera/events/[messmassEventId]/frame-context/route';

const call = (id: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://localhost/api/integrations/camera/events/${id}/frame-context`, { headers }), {
    params: Promise.resolve({ messmassEventId: id }),
  });

test('without the camera secret the answer is 401 and nothing is read', async () => {
  expect((await call(String(project._id))).status).toBe(401);
  expect((await call(String(project._id), { 'x-camera-secret': 'wrong' })).status).toBe(401);
});

test('a malformed id is 400 and an unknown event is 404', async () => {
  expect((await call('nope', { 'x-camera-secret': 'test-secret' })).status).toBe(400);
  expect((await call(String(new ObjectId()), { authorization: 'Bearer test-secret' })).status).toBe(404);
});

test('with the secret the resolved context comes back, system default style included', async () => {
  const res = await call(String(project._id), { 'x-camera-secret': 'test-secret' });
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.success).toBe(true);
  expect(body.event).toMatchObject({ name: 'Fan Day', homeTeam: null, visitorTeam: null });
  expect(body.template).toMatchObject({ resolvedFrom: 'hardcoded' });
  expect(body.style).toMatchObject({ resolvedFrom: 'system-default', fontFamily: 'Inter' });
});
