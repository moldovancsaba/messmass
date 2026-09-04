// tests/security/cron-auth.test.ts
// WHAT: Fail-closed coverage for the cron-triggered routes (messmass#348).
// WHY: Two routes authenticated scheduled callers by comparing the raw
//     Authorization header against `Bearer ${process.env.CRON_SECRET}` with no
//     unset check. With CRON_SECRET unset that made the literal string
//     `Bearer undefined` a valid credential on /api/bitly/sync, and
//     /api/cron/bitly-refresh skipped auth entirely. These tests pin the
//     fail-closed behavior so the pattern cannot quietly return.

import { NextRequest } from 'next/server';

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

function mockSyncRouteDeps(opts: { adminUser?: { id: string } | null }) {
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => opts.adminUser ?? null),
  }));
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          find: jest.fn(() => ({ toArray: jest.fn(async () => []) })),
          insertOne: jest.fn(async () => ({ insertedId: 'job' })),
          updateOne: jest.fn(async () => ({})),
        })),
      })),
    }),
  }));
  jest.doMock('@/lib/config', () => ({
    __esModule: true,
    default: { dbName: 'messmass-test' },
  }));
  jest.doMock('@/lib/bitly', () => ({
    __esModule: true,
    getFullAnalytics: jest.fn(async () => ({})),
  }));
  jest.doMock('@/lib/logger', () => ({
    __esModule: true,
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }));
}

function mockRefreshRouteDeps() {
  jest.doMock('@/lib/bitly-recalculator', () => ({
    __esModule: true,
    refreshAllCachedMetrics: jest.fn(async () => 3),
  }));
}

function request(url: string, method: string, bearer?: string) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  if (ORIGINAL_CRON_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
});

describe('POST/GET /api/bitly/sync cron auth fails closed', () => {
  it('rejects `Bearer undefined` when CRON_SECRET is unset (401)', async () => {
    delete process.env.CRON_SECRET;
    mockSyncRouteDeps({ adminUser: null });
    const { POST } = await import('@/app/api/bitly/sync/route');
    const res = await POST(request('/api/bitly/sync', 'POST', 'undefined'));
    expect(res.status).toBe(401);
  });

  it('rejects a wrong bearer with no admin session when CRON_SECRET is set (401)', async () => {
    process.env.CRON_SECRET = 'real-secret';
    mockSyncRouteDeps({ adminUser: null });
    const { POST } = await import('@/app/api/bitly/sync/route');
    const res = await POST(request('/api/bitly/sync', 'POST', 'wrong'));
    expect(res.status).toBe(401);
  });

  it('exports GET (the method Vercel cron issues) and it accepts the cron secret', async () => {
    process.env.CRON_SECRET = 'real-secret';
    mockSyncRouteDeps({ adminUser: null });
    const route = await import('@/app/api/bitly/sync/route');
    expect(typeof route.GET).toBe('function');
    const res = await route.GET(request('/api/bitly/sync', 'GET', 'real-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.linksScanned).toBe(0);
  });
});

describe('GET /api/cron/bitly-refresh fails closed', () => {
  it('rejects everything when CRON_SECRET is unset (401)', async () => {
    delete process.env.CRON_SECRET;
    mockRefreshRouteDeps();
    const { GET } = await import('@/app/api/cron/bitly-refresh/route');
    expect((await GET(request('/api/cron/bitly-refresh', 'GET'))).status).toBe(401);
    expect((await GET(request('/api/cron/bitly-refresh', 'GET', 'undefined'))).status).toBe(401);
  });

  it('accepts only the exact secret when set', async () => {
    process.env.CRON_SECRET = 'real-secret';
    mockRefreshRouteDeps();
    const { GET } = await import('@/app/api/cron/bitly-refresh/route');
    expect((await GET(request('/api/cron/bitly-refresh', 'GET', 'wrong'))).status).toBe(401);
    const ok = await GET(request('/api/cron/bitly-refresh', 'GET', 'real-secret'));
    expect(ok.status).toBe(200);
    expect((await ok.json()).associationsRefreshed).toBe(3);
  });
});
