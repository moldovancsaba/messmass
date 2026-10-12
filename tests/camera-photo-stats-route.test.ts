// tests/camera-photo-stats-route.test.ts
// WHAT: POST /api/integrations/camera/events/[messmassEventId]/photo-stats is behind the camera shared secret, answers 400 for a malformed id or body, 404 for an
//     unknown event, 500 when the stats write fails, and 200 with the counters and the catalog outcome otherwise. A catalog failure never undoes the stats write.
// HOW: fakes only: the database, the secret and the logger are replaced, so nothing is read or written anywhere.

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const known = new ObjectId();
const projectWrites: Array<{ filter: Record<string, unknown>; update: Record<string, any> }> = [];
const catalogWrites: any[][] = [];
const behavior = { projectsFail: false, catalogFail: false };
const logged: string[] = [];

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return { __esModule: true, default: { ...actual.default, cameraProvisionToken: 'test-secret' } };
});
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  error: (message: string) => { logged.push(message); },
  warn: () => {},
  info: () => {},
  debug: () => {},
}));
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) =>
      name === 'projects'
        ? {
            updateOne: async (filter: Record<string, unknown>, update: Record<string, any>) => {
              if (behavior.projectsFail) throw new Error('boom');
              projectWrites.push({ filter, update });
              return { matchedCount: String(filter._id) === String(known) ? 1 : 0 };
            },
          }
        : {
            bulkWrite: async (operations: any[]) => {
              if (behavior.catalogFail) throw new Error('catalog down');
              catalogWrites.push(operations);
              return {};
            },
          },
  }),
  default: async () => ({}),
}));

import { POST } from '@/app/api/integrations/camera/events/[messmassEventId]/photo-stats/route';

const body = {
  totals: { camera_images_approved: 12, camera_gender_female: 7 },
  averages: { camera_avg_vetting_seconds: 41.5 },
};
const secret = { 'x-camera-secret': 'test-secret' };
const call = (id: string, payload: unknown, headers: Record<string, string> = secret, raw = false) =>
  POST(
    new NextRequest(`http://localhost/api/integrations/camera/events/${id}/photo-stats`, {
      method: 'POST',
      body: raw ? (payload as string) : JSON.stringify(payload),
      headers,
    }),
    { params: Promise.resolve({ messmassEventId: id }) }
  );

beforeEach(() => {
  projectWrites.length = 0;
  catalogWrites.length = 0;
  logged.length = 0;
  behavior.projectsFail = false;
  behavior.catalogFail = false;
});

test('without the camera secret the answer is 401 and nothing is written', async () => {
  expect((await call(String(known), body, {})).status).toBe(401);
  expect((await call(String(known), body, { 'x-camera-secret': 'wrong' })).status).toBe(401);
  expect((await call(String(known), body, { authorization: 'Bearer wrong' })).status).toBe(401);
  expect(projectWrites).toHaveLength(0);
  expect(catalogWrites).toHaveLength(0);
});

test('a malformed event id is 400, also one that only has the length of an id', async () => {
  for (const id of ['nope', 'abcdefghijkl', 'zzzzzzzzzzzzzzzzzzzzzzzz', `${String(known)}0`, '../admin']) {
    const res = await call(id, body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_event_id');
  }
  expect(projectWrites).toHaveLength(0);
});

test('a bad body is 400 with the reason in detail, and nothing is written', async () => {
  const headers = secret;
  const cases: Array<[unknown, string]> = [
    [{ totals: { female: 3 } }, 'not a camera counter name'],
    [{ totals: { camera_a: 1 }, averages: { camera_a: 1 } }, 'both totals and averages'],
    [{ totals: { camera_a: 1.5 } }, 'whole number'],
    [{ totals: { camera_a: 1 }, extra: true }, 'unknown field'],
    [{ totals: {} }, 'at least one'],
    [{ totals: { camera_a: 1 }, labels: { camera_b: 'B' } }, 'not in totals or averages'],
  ];
  for (const [payload, detail] of cases) {
    const res = await call(String(known), payload, headers);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_photo_stats');
    expect(json.detail).toContain(detail);
  }
  const notJson = await call(String(known), 'this is not json', headers, true);
  expect(notJson.status).toBe(400);
  expect((await notJson.json()).error).toBe('invalid_photo_stats');
  expect(projectWrites).toHaveLength(0);
  expect(catalogWrites).toHaveLength(0);
});

test('an unknown event is 404 and no catalog entry is made for it', async () => {
  const res = await call(String(new ObjectId()), body);
  expect(res.status).toBe(404);
  expect((await res.json()).error).toBe('event_not_found');
  expect(catalogWrites).toHaveLength(0);
});

test('with the secret and a good body one update sets the camera_ stats, the catalog is registered and the counters come back', async () => {
  const res = await call(String(known), body, { authorization: 'Bearer test-secret' });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true, totals: body.totals, averages: body.averages, catalog: 'registered' });

  expect(projectWrites).toHaveLength(1);
  expect(projectWrites[0].filter).toEqual({ _id: known });
  expect(Object.keys(projectWrites[0].update)).toEqual(['$set']);
  expect(Object.keys(projectWrites[0].update.$set).sort()).toEqual([
    'cameraPhotoStats',
    'stats.camera_avg_vetting_seconds',
    'stats.camera_gender_female',
    'stats.camera_images_approved',
  ]);

  expect(catalogWrites).toHaveLength(1);
  expect(catalogWrites[0].map((o) => o.updateOne.filter.name).sort()).toEqual(['camera_avg_vetting_seconds', 'camera_gender_female', 'camera_images_approved']);
  for (const operation of catalogWrites[0]) expect(Object.keys(operation.updateOne.update)).toEqual(['$setOnInsert']);
});

test('the same request twice answers the same and writes the same update', async () => {
  const first = await call(String(known), body);
  const second = await call(String(known), body);
  expect(await first.json()).toEqual(await second.json());
  expect(projectWrites[0].update.$set.cameraPhotoStats.totals).toEqual(projectWrites[1].update.$set.cameraPhotoStats.totals);
  for (const path of Object.keys(projectWrites[0].update.$set)) {
    if (path.startsWith('stats.')) expect(projectWrites[1].update.$set[path]).toBe(projectWrites[0].update.$set[path]);
  }
});

test('a catalog failure does not fail the push: 200, catalog failed, logged', async () => {
  behavior.catalogFail = true;
  const res = await call(String(known), body);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toMatchObject({ success: true, catalog: 'failed', totals: body.totals });
  expect(projectWrites).toHaveLength(1);
  expect(logged).toContain('Camera photo stats: catalog registration failed');
});

test('a failing stats write is 500, logged, and registers nothing in the catalog', async () => {
  behavior.projectsFail = true;
  const res = await call(String(known), body);
  expect(res.status).toBe(500);
  expect((await res.json()).error).toBe('photo_stats_failed');
  expect(catalogWrites).toHaveLength(0);
  expect(logged).toContain('Camera photo stats failed');
});
