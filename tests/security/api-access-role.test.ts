// tests/security/api-access-role.test.ts
// WHAT: Role gate on POST/PUT /api/admin/local-users/[id]/api-access.
// WHY: Both handlers only checked getAdminUser(), which returns any signed-in
//     account (SSO auto-provisions guest/user/api roles), so a low-role account
//     could mint -- and receive the plaintext of -- any user's API key and then
//     act as that account on /api/public/*. Pins: admin/superadmin only, and a
//     superadmin's key only by a superadmin.

import { NextRequest } from 'next/server';

type Role = 'guest' | 'user' | 'api' | 'admin' | 'superadmin';

const rotateApiKey = jest.fn(async (id: string) => ({
  apiKey: 'plaintext-key',
  user: { _id: id, email: 't@example.com', name: 'T', role: 'user', apiKeyEnabled: true, updatedAt: 'now' },
}));
const toggleAPIAccess = jest.fn(async () => ({ _id: 'u', apiKeyEnabled: true }));

function mockDeps(actorRole: Role, targetRole: Role) {
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => ({ id: 'actor', email: 'a@example.com', role: actorRole })),
  }));
  jest.doMock('@/lib/users', () => ({
    __esModule: true,
    findUserById: jest.fn(async () => ({ _id: 'target', email: 't@example.com', role: targetRole, apiUsageCount: 0 })),
    rotateApiKey,
    toggleAPIAccess,
  }));
  jest.doMock('@/lib/logger', () => ({ __esModule: true, info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));
}

const ctx = { params: Promise.resolve({ id: 'target' }) };
const post = () => new NextRequest('http://localhost/api/admin/local-users/target/api-access', { method: 'POST' });
const put = () =>
  new NextRequest('http://localhost/api/admin/local-users/target/api-access', {
    method: 'PUT',
    body: JSON.stringify({ enabled: true }),
  });

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('api-access role gate', () => {
  it.each(['guest', 'user', 'api'] as Role[])('%s cannot rotate or toggle a key (403)', async (role) => {
    mockDeps(role, 'user');
    const route = await import('@/app/api/admin/local-users/[id]/api-access/route');
    expect((await route.POST(post(), ctx)).status).toBe(403);
    expect((await route.PUT(put(), ctx)).status).toBe(403);
    expect(rotateApiKey).not.toHaveBeenCalled();
    expect(toggleAPIAccess).not.toHaveBeenCalled();
  });

  it('admin can rotate a non-superadmin key', async () => {
    mockDeps('admin', 'api');
    const route = await import('@/app/api/admin/local-users/[id]/api-access/route');
    expect((await route.POST(post(), ctx)).status).toBe(200);
    expect(rotateApiKey).toHaveBeenCalledTimes(1);
  });

  it("admin cannot rotate or toggle a superadmin's key (403)", async () => {
    mockDeps('admin', 'superadmin');
    const route = await import('@/app/api/admin/local-users/[id]/api-access/route');
    expect((await route.POST(post(), ctx)).status).toBe(403);
    expect((await route.PUT(put(), ctx)).status).toBe(403);
    expect(rotateApiKey).not.toHaveBeenCalled();
  });

  it("superadmin can rotate a superadmin's key", async () => {
    mockDeps('superadmin', 'superadmin');
    const route = await import('@/app/api/admin/local-users/[id]/api-access/route');
    expect((await route.POST(post(), ctx)).status).toBe(200);
  });
});
