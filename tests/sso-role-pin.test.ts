// tests/sso-role-pin.test.ts
// WHAT: Covers the one invariant that makes local role management possible:
//     mintMessmassSessionForSsoUser() must not overwrite `role` for a user a
//     superadmin pinned locally (roleManagedLocally), while still syncing every
//     other user's role from SSO.
// WHY: SSO is the default source of truth and the sign-in path rewrites `role`
//     on every login. Before the pin existed, a role changed in the messmass
//     admin UI silently reverted the next time that user signed in, so the
//     feature looked like it worked and then undid itself. The pin must also
//     NOT become a way around SSO access control -- revoking someone in SSO has
//     to keep locking them out no matter what role is pinned.
// HOW: Stub lib/users with an in-memory record plus the two calls this path
//     makes (getUsersCollection().updateOne, updateUserLastLogin), and a
//     response object exposing only cookies.set.

const store: { user: any } = { user: null };
const updates: any[] = [];

jest.mock('@/lib/users', () => ({
  findUserBySsoId: jest.fn(async (id: string) =>
    store.user && store.user.ssoUserId === id ? store.user : null
  ),
  findUserByEmail: jest.fn(async (email: string) =>
    store.user && store.user.email === email ? store.user : null
  ),
  createUser: jest.fn(async (doc: any) => {
    store.user = { ...doc, _id: { toString: () => 'new-user-id' } };
    return store.user;
  }),
  updateUserLastLogin: jest.fn(async () => undefined),
  getUsersCollection: jest.fn(async () => ({
    async updateOne(filter: any, update: any) {
      updates.push(update.$set);
      Object.assign(store.user, update.$set);
      return { modifiedCount: 1 };
    },
  })),
}));

jest.mock('@/lib/sessionTokens', () => ({
  generateSessionToken: jest.fn(() => 'test-session-token'),
}));
jest.mock('@/lib/logger', () => ({
  logAuthSuccess: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import { mintMessmassSessionForSsoUser } from '@/lib/auth/mintSession';

const ssoUser = { id: 'sso-1', email: 'a@example.com', name: 'A' };
const request = { headers: { get: () => '' } } as any;

// Access is gated by hasAccess + status === 'approved'; `role` only decides which
// messmass role a non-pinned user is synced to.
function permission(role: string, access: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'sso-1',
    clientId: 'messmass',
    appName: 'messmass',
    hasAccess: true,
    status: 'approved',
    role,
    ...access,
  } as any;
}

function makeResponse() {
  return { cookies: { set: jest.fn() } } as any;
}

function seedUser(overrides: Record<string, unknown>) {
  store.user = {
    _id: { toString: () => 'user-1' },
    email: ssoUser.email,
    name: 'A',
    ssoUserId: ssoUser.id,
    role: 'user',
    ...overrides,
  };
}

beforeEach(() => {
  updates.length = 0;
  store.user = null;
});

describe('SSO role sync', () => {
  it('overwrites the local role from SSO when the role is not pinned', async () => {
    seedUser({ role: 'user' });
    const result = await mintMessmassSessionForSsoUser(
      ssoUser,
      permission('admin'),
      request,
      makeResponse()
    );
    expect(result!.role).toBe('admin');
    expect(store.user.role).toBe('admin');
    expect(updates.some((u) => u.role === 'admin')).toBe(true);
  });

  it('keeps a locally pinned role even when SSO disagrees', async () => {
    seedUser({ role: 'superadmin', roleManagedLocally: true });
    const result = await mintMessmassSessionForSsoUser(
      ssoUser,
      permission('user'),
      request,
      makeResponse()
    );
    expect(result!.role).toBe('superadmin');
    expect(store.user.role).toBe('superadmin');
    // the pin must not suppress the ssoUserId link, only the role
    expect(updates.every((u) => u.role === undefined)).toBe(true);
  });

  it('still links ssoUserId on a pinned user whose SSO id changed', async () => {
    seedUser({ role: 'superadmin', roleManagedLocally: true, ssoUserId: 'stale' });
    await mintMessmassSessionForSsoUser(
      ssoUser,
      permission('user'),
      request,
      makeResponse()
    );
    expect(store.user.ssoUserId).toBe('sso-1');
    expect(store.user.role).toBe('superadmin');
  });

  it('denies sign-in when SSO revokes access, even for a pinned superadmin', async () => {
    seedUser({ role: 'superadmin', roleManagedLocally: true });
    const result = await mintMessmassSessionForSsoUser(
      ssoUser,
      permission('superadmin', { status: 'revoked' }),
      request,
      makeResponse()
    );
    expect(result).toBeNull();
  });
});
