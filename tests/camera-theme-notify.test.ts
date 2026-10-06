// tests/camera-theme-notify.test.ts
// WHAT: notifyCameraThemeChanged / notifyCameraPartnerChanged (lib/cameraThemeNotify.ts) tell camera that the look of its events changed.
// HOW: fetch is replaced; the database is a tiny fake of projects.find().limit().toArray().

import { ObjectId } from 'mongodb';

jest.mock('@/lib/config', () => ({ __esModule: true, default: { cameraBaseUrl: 'https://camera.example.test/', cameraProvisionToken: 'shh' } }));
jest.mock('@/lib/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

import { eventsOfPartner, notifyCameraPartnerChanged, notifyCameraThemeChanged } from '@/lib/cameraThemeNotify';

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

function fakeProjects(rows: Array<{ _id: ObjectId }>) {
  return { collection: () => ({ find: () => ({ limit: () => ({ toArray: async () => rows }) }) }) } as any;
}

test('a style change is posted to camera with the shared secret, for all events', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  global.fetch = (async (url: string, init: RequestInit) => (calls.push({ url, init }), { ok: true })) as any;
  expect(await notifyCameraThemeChanged({ scope: 'all' })).toBe(true);
  expect(calls[0].url).toBe('https://camera.example.test/api/internal/messmass/theme-updated');
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ scope: 'all' });
  expect((calls[0].init.headers as Record<string, string>)['x-messmass-secret']).toBe('shh');
});

test('it never throws: an unreachable camera is false, and an empty list sends nothing', async () => {
  global.fetch = (async () => {
    throw new Error('down');
  }) as any;
  expect(await notifyCameraThemeChanged({ scope: 'all' })).toBe(false);
  let called = false;
  global.fetch = (async () => ((called = true), { ok: true })) as any;
  expect(await notifyCameraThemeChanged({ scope: 'events', messmassEventIds: [] })).toBe(false);
  expect(called).toBe(false);
});

test('a partner change notifies the events the partner is part of, only for fields that reach camera', async () => {
  const a = new ObjectId();
  const b = new ObjectId();
  const bodies: unknown[] = [];
  global.fetch = (async (_url: string, init: RequestInit) => (bodies.push(JSON.parse(String(init.body))), { ok: true })) as any;
  const db = fakeProjects([{ _id: a }, { _id: b }]);
  expect(await eventsOfPartner(db, String(new ObjectId()))).toEqual([String(a), String(b)]);
  expect(await notifyCameraPartnerChanged(db, String(new ObjectId()), { logoUrl: 'https://x/logo.png' })).toBe(true);
  expect(bodies).toEqual([{ scope: 'events', messmassEventIds: [String(a), String(b)] }]);
  expect(await notifyCameraPartnerChanged(db, String(new ObjectId()), { hashtags: ['a'] })).toBe(false);
  expect(bodies).toHaveLength(1);
});
