// tests/security/read-route-auth.test.ts
// WHAT: Runtime acceptance pin for messmass#386 — the flagship formerly-open
//     read routes actually return 401 to an anonymous caller, not just
//     "contain an auth primitive" (which tests/api-mutation-auth.test.ts
//     already sweeps statically for all of them).
// WHY: GET /api/analytics/executive/metrics served company-wide revenue/ROI
//     to anonymous callers, and GET /api/admin/email-selftest leaked the
//     superadmin email and sent real mail. These two pin the guard's runtime
//     behavior for the whole requireSession batch (identical house pattern).

import { NextRequest } from 'next/server';

function mockAnonymousSession() {
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => null),
  }));
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({ db: jest.fn() }),
  }));
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('formerly-open read routes fail closed for anonymous callers', () => {
  it('GET /api/analytics/executive/metrics => 401', async () => {
    mockAnonymousSession();
    const { GET } = await import('@/app/api/analytics/executive/metrics/route');
    const res = await GET(new NextRequest('http://localhost/api/analytics/executive/metrics'));
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/email-selftest => 401 (no email sent, address not leaked)', async () => {
    mockAnonymousSession();
    const sendSpy = jest.fn();
    jest.doMock('@/lib/emailNotifications', () => ({
      __esModule: true,
      testEmailConfig: sendSpy,
    }));
    const { GET } = await import('@/app/api/admin/email-selftest/route');
    const res = await GET(new NextRequest('http://localhost/api/admin/email-selftest'));
    expect(res.status).toBe(401);
    expect(sendSpy).not.toHaveBeenCalled();
  });
});
