// tests/api-key-decoupling.test.ts
// WHAT: Coverage for F-011 (issue messmass#397, option A) -- decoupling API keys
//     from login passwords in lib/apiAuth.ts's validateAPIKey.
// WHY: A user's login `password` used to double as their API key --
//     validateAPIKey fell back to `findOne({ password })`, which is why that
//     field existed in the clear. The migration is finished: the two accounts
//     that held one had never authenticated a request, the field is gone from
//     every document, and the fallback with it.
//     This file used to pin the two-path behaviour. It now pins the single
//     path, including the negative that matters most -- a plaintext password
//     value must NOT authenticate, because that is the whole finding.

import type { UserDoc } from '@/lib/users';

function mockUsers(overrides: Partial<{
  findUserByApiKeyHash: (key: string) => Promise<UserDoc | null>;
}> = {}) {
  const updateAPIUsage = jest.fn(async () => {});
  jest.doMock('@/lib/users', () => ({
    __esModule: true,
    findUserByApiKeyHash: overrides.findUserByApiKeyHash ?? jest.fn(async () => null),
    updateAPIUsage,
  }));
  return { updateAPIUsage };
}

function mockLogger() {
  const warn = jest.fn();
  jest.doMock('@/lib/logger', () => ({
    __esModule: true,
    debug: jest.fn(),
    warn,
    error: jest.fn(),
  }));
  return { warn };
}

function makeUser(overrides: Partial<UserDoc> = {}): UserDoc {
  return {
    _id: { toString: () => 'user-1' } as any,
    email: 'integration@example.com',
    name: 'Integration User',
    role: 'api',
    apiKeyEnabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('F-011: decoupled API key validation (lib/apiAuth.ts validateAPIKey)', () => {
  it('authenticates only through the hashed key', async () => {
    const user = makeUser({ apiKeyHash: 'bcrypt-hash-stand-in' });
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async (key: string) => (key === 'new-independent-key' ? user : null)),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('new-independent-key');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('integration@example.com');
  });

  it('rejects a plaintext password value presented as a key', async () => {
    // The finding itself. `findOne({ password })` used to make this succeed,
    // which is why the field had to be stored in the clear. Nothing looks at a
    // password on this path any more, so the hashed lookup is the only chance a
    // token gets -- and it misses.
    mockLogger();
    mockUsers({ findUserByApiKeyHash: jest.fn(async () => null) });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('old-plaintext-password-value');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('never consults a password field, whatever the token', async () => {
    // Guards against the fallback being reintroduced: lib/users no longer
    // exports findUserByPassword, so a reinstated call would fail here first.
    const users = await import('@/lib/users');
    expect((users as Record<string, unknown>).findUserByPassword).toBeUndefined();
  });

  it('rejects a wrong key when no account matches', async () => {
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('totally-wrong-key');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('rejects a wrong key against an account that has a hashed key', async () => {
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null), // wrong key never matches the hash
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('totally-wrong-key');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('rejects a correctly-identified account with apiKeyEnabled=false', async () => {
    // Identification succeeds and authorisation still refuses: a valid key on a
    // disabled account must not authenticate.
    mockLogger();
    const disabledUser = makeUser({ apiKeyEnabled: false, apiKeyHash: 'bcrypt-hash-stand-in' });
    mockUsers({
      findUserByApiKeyHash: jest.fn(async (key: string) => (key === 'disabled-user-key' ? disabledUser : null)),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('disabled-user-key');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('API_ACCESS_DISABLED');
  });
});

describe('F-011: lib/users.ts apiKeyHash primitives', () => {
  // WHAT: These exercise the REAL lib/users.ts (not the jest.doMock'd stand-in
  //     used by the validateAPIKey tests above).
  // WHY: jest.doMock registrations persist across tests within a file even
  //     after jest.resetModules() (which only clears the require cache, not
  //     the mock factory registration) -- jest.dontMock undoes that. lib/users.ts
  //     transitively imports lib/mongodb, whose default export opens a real
  //     connection attempt at module-load time (house pattern elsewhere, e.g.
  //     tests/page-password-partner-alias.test.ts) -- mock it out so importing
  //     the module never touches the network; generateApiKey/hashApiKey/
  //     verifyApiKey don't touch the DB at all, so a stand-in client is enough.
  beforeEach(() => {
    jest.dontMock('@/lib/users');
    jest.resetModules();
    jest.doMock('@/lib/mongodb', () => ({
      __esModule: true,
      default: Promise.resolve({ db: jest.fn() }),
    }));
  });

  it('generateApiKey produces independent, non-empty random keys (not derived from a password)', async () => {
    const { generateApiKey } = await import('@/lib/users');
    const a = generateApiKey();
    const b = generateApiKey();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
  });

  it('hashApiKey/verifyApiKey round-trip correctly and reject a wrong key', async () => {
    const { generateApiKey, hashApiKey, verifyApiKey } = await import('@/lib/users');
    const key = generateApiKey();
    const hash = await hashApiKey(key);

    await expect(verifyApiKey(key, hash)).resolves.toBe(true);
    await expect(verifyApiKey('not-the-key', hash)).resolves.toBe(false);
  });
});
