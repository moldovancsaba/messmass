// tests/rate-limit-classes.test.ts
// WHAT: Which rate-limit class each kind of request takes, the numbers of the classes, and how the counter behaves
//     (lib/rateLimit.ts, applied by middleware.ts).
// WHY: The public class was keyed on /stats/*, a route that no longer exists, so /report/* pages took the read
//     budget, which was 500 a minute "temporarily, for testing". The header called the counter a token bucket;
//     it is a fixed window.
// HOW: real NextRequest objects through getRateLimitConfig and rateLimitMiddleware, with fake timers for the window.

import { NextRequest } from 'next/server';
import {
  RATE_LIMITS,
  checkRateLimit,
  clearRateLimitStore,
  getRateLimitConfig,
  isPublicPagePath,
  rateLimitMiddleware,
} from '@/lib/rateLimit';

const req = (path: string, method = 'GET', ip = '203.0.113.7') =>
  new NextRequest(`http://localhost${path}`, { method, headers: { 'x-forwarded-for': ip } });

/** One request through the same two calls middleware.ts makes. */
const hit = (path: string, method = 'GET', ip = '203.0.113.7') => {
  const request = req(path, method, ip);
  return rateLimitMiddleware(request, getRateLimitConfig(request));
};

beforeEach(() => {
  clearRateLimitStore();
});

describe('the classes and their numbers', () => {
  test('there are seven classes', () => {
    expect(Object.keys(RATE_LIMITS).sort()).toEqual(['AUTH', 'CONTACT', 'EDITOR_SAVE', 'EXPORT', 'PUBLIC', 'READ', 'WRITE']);
  });

  test('reads are far below the old 500 a minute, public pages below reads', () => {
    expect(RATE_LIMITS.READ.maxRequests).toBe(120);
    expect(RATE_LIMITS.PUBLIC.maxRequests).toBe(60);
    expect(RATE_LIMITS.PUBLIC.maxRequests).toBeLessThan(RATE_LIMITS.READ.maxRequests);
    // No per-minute class is above 120 any more.
    for (const [name, limit] of Object.entries(RATE_LIMITS)) {
      if (limit.windowMs === 60_000) expect({ name, ok: limit.maxRequests <= 120 }).toEqual({ name, ok: true });
    }
  });

  test('the strict classes are unchanged', () => {
    expect(RATE_LIMITS.AUTH).toMatchObject({ windowMs: 15 * 60_000, maxRequests: 5 });
    expect(RATE_LIMITS.CONTACT).toMatchObject({ windowMs: 15 * 60_000, maxRequests: 5 });
    expect(RATE_LIMITS.WRITE).toMatchObject({ windowMs: 60_000, maxRequests: 30 });
    expect(RATE_LIMITS.EDITOR_SAVE).toMatchObject({ windowMs: 60_000, maxRequests: 120 });
    expect(RATE_LIMITS.EXPORT).toMatchObject({ windowMs: 60_000, maxRequests: 6 });
  });
});

describe('which class a request takes', () => {
  test('the public report pages take the public class', () => {
    for (const path of ['/report/0b1f9c1e-0000-4000-8000-000000000001', '/partner-report/fc-example', '/filter/some-filter', '/hashtag/derby']) {
      expect({ path, config: getRateLimitConfig(req(path)) }).toEqual({ path, config: RATE_LIMITS.PUBLIC });
    }
    expect(getRateLimitConfig(req('/report/abc', 'HEAD'))).toBe(RATE_LIMITS.PUBLIC);
  });

  test('/stats/ no longer means anything: that route is gone', () => {
    expect(isPublicPagePath('/stats/abc')).toBe(false);
    expect(getRateLimitConfig(req('/stats/abc'))).toBe(RATE_LIMITS.READ);
  });

  test('the API calls a report page makes are reads, not public pages', () => {
    for (const path of ['/api/projects/stats/abc', '/api/reports/resolve', '/api/chart-config/public', '/api/report-config/abc', '/api/report-styles/abc']) {
      expect({ path, config: getRateLimitConfig(req(path)) }).toEqual({ path, config: RATE_LIMITS.READ });
    }
  });

  test('a state-changing request to a public page path keeps the write budget', () => {
    expect(getRateLimitConfig(req('/report/abc', 'POST'))).toBe(RATE_LIMITS.WRITE);
    expect(getRateLimitConfig(req('/partner-report/abc', 'PUT'))).toBe(RATE_LIMITS.WRITE);
  });

  test('paths that merely start with the same letters are not public pages', () => {
    for (const path of ['/reports/abc', '/report', '/api/report/abc', '/partner-reports/x', '/filters/x']) {
      expect({ path, public: isPublicPagePath(path) }).toEqual({ path, public: false });
    }
  });

  test('the other classes still match as before', () => {
    expect(getRateLimitConfig(req('/api/admin/login', 'POST'))).toBe(RATE_LIMITS.AUTH);
    expect(getRateLimitConfig(req('/api/auth/sso/login'))).toBe(RATE_LIMITS.AUTH);
    expect(getRateLimitConfig(req('/api/auth/logout', 'DELETE'))).toBe(RATE_LIMITS.WRITE);
    expect(getRateLimitConfig(req('/api/contact', 'POST'))).toBe(RATE_LIMITS.CONTACT);
    expect(getRateLimitConfig(req('/api/projects', 'PUT'))).toBe(RATE_LIMITS.EDITOR_SAVE);
    expect(getRateLimitConfig(req('/api/projects/abc', 'PUT'))).toBe(RATE_LIMITS.WRITE);
    expect(getRateLimitConfig(req('/api/partners', 'POST'))).toBe(RATE_LIMITS.WRITE);
    expect(getRateLimitConfig(req('/api/projects'))).toBe(RATE_LIMITS.READ);
  });
});

describe('the counter is a fixed window per client and path', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('the 121st read of one path in a minute is refused with Retry-After, the 120th is not', async () => {
    for (let i = 0; i < RATE_LIMITS.READ.maxRequests; i++) {
      expect(await hit('/api/chart-config/public')).toBeNull();
    }
    const refused = await hit('/api/chart-config/public');
    expect(refused?.status).toBe(429);
    expect(Number(refused?.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(Number(refused?.headers.get('Retry-After'))).toBeLessThanOrEqual(60);
    expect(refused?.headers.get('X-RateLimit-Limit')).toBe('120');
  });

  test('the 61st load of one report page from one IP is refused, another report is not', async () => {
    for (let i = 0; i < RATE_LIMITS.PUBLIC.maxRequests; i++) {
      expect(await hit('/report/aaaa')).toBeNull();
    }
    expect((await hit('/report/aaaa'))?.status).toBe(429);
    expect(await hit('/report/bbbb')).toBeNull();
  });

  test('every path has its own bucket and so does every IP', async () => {
    for (let i = 0; i < RATE_LIMITS.READ.maxRequests; i++) await hit('/api/chart-config/public');
    expect((await hit('/api/chart-config/public'))?.status).toBe(429);
    expect(await hit('/api/reports/resolve')).toBeNull();
    expect(await hit('/api/chart-config/public', 'GET', '198.51.100.9')).toBeNull();
  });

  test('the query string is not part of the key', async () => {
    for (let i = 0; i < RATE_LIMITS.READ.maxRequests; i++) await hit(`/api/reports/resolve?projectId=${i}`);
    expect((await hit('/api/reports/resolve?projectId=next'))?.status).toBe(429);
  });

  test('the window is fixed: it opens on the first request and the count starts again after it, with no refill in between', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-11T12:00:00Z'));
    const config = { windowMs: 60_000, maxRequests: 3 };

    expect(checkRateLimit('k', config)).toMatchObject({ allowed: true, remaining: 2 });
    jest.setSystemTime(new Date('2026-10-11T12:00:30Z'));
    expect(checkRateLimit('k', config)).toMatchObject({ allowed: true, remaining: 1 });
    expect(checkRateLimit('k', config)).toMatchObject({ allowed: true, remaining: 0 });
    // A token bucket would have refilled by now; a fixed window has not.
    jest.setSystemTime(new Date('2026-10-11T12:00:59Z'));
    expect(checkRateLimit('k', config)).toMatchObject({ allowed: false, remaining: 0, retryAfter: 1 });
    // Past the first request's window the counter is back to one.
    jest.setSystemTime(new Date('2026-10-11T12:01:01Z'));
    expect(checkRateLimit('k', config)).toMatchObject({ allowed: true, remaining: 2 });
  });
});

describe('legitimate traffic fits with headroom', () => {
  // The calls one event-report load makes, by path (hooks/useReportData.ts, hooks/useReportLayout.ts,
  // hooks/useReportStyle.ts, app/report/[slug]/page.tsx). chart-config/public is fetched twice.
  const reportLoad = (slug: string) => [
    `/report/${slug}`,
    `/api/projects/stats/${slug}`,
    '/api/reports/resolve',
    '/api/chart-config/public',
    '/api/chart-config/public',
    `/api/report-config/${slug}`,
    '/api/report-styles/style-1',
  ];

  test('an office of 10 people with 3 tabs on one report in the same minute is not refused', async () => {
    for (let person = 0; person < 10; person++) {
      for (let tab = 0; tab < 3; tab++) {
        for (const path of reportLoad('event-1')) {
          expect({ person, tab, path, refused: await hit(path) }).toEqual({ person, tab, path, refused: null });
        }
      }
    }
  });

  test('...and has at least double headroom on the busiest path of that worst case', () => {
    const loads = 10 * 3;
    const chartConfigHits = loads * 2;
    expect(chartConfigHits * 2).toBeLessThanOrEqual(RATE_LIMITS.READ.maxRequests);
    expect(loads * 2).toBeLessThanOrEqual(RATE_LIMITS.PUBLIC.maxRequests);
  });

  test('five open fanmass dashboard tabs (5 s poll each) and the fanmass worker polls fit', async () => {
    const tabs = 5;
    const pollsPerMinutePerTab = 60 / 5;
    for (let i = 0; i < tabs * pollsPerMinutePerTab; i++) {
      expect(await hit('/api/admin/fanmass/snapshot')).toBeNull();
    }
    for (let i = 0; i < 12; i++) {
      expect(await hit('/api/integrations/fanmass/commands')).toBeNull();
      expect(await hit('/api/integrations/fanmass/rescan-requests')).toBeNull();
      expect(await hit('/api/integrations/fanmass/drive-folders/pending-sync')).toBeNull();
    }
  });
});
