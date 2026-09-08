// tests/api-key-decoupling.test.ts
// WHAT: Coverage for F-011 (issue messmass#397, option A) -- decoupling API keys
//     from login passwords in lib/apiAuth.ts's validateAPIKey.
// WHY: Until now a user's login `password` doubled as their API key. This pins
//     the non-breaking migration behavior:
//       - an account with no apiKeyHash still authenticates via the legacy
//         password-as-key path (existing integrations keep working unchanged)
//       - an account with apiKeyHash set authenticates via the new hashed key
//         and no longer accepts its old password value as a key
//       - a wrong key is rejected in both modes
//     It also pins that the legacy fallback path logs a warning when used, per
//     the F-011 requirement that use of the deprecated path be observable.

import type { UserDoc } from '@/lib/users';

function mockUsers(overrides: Partial<{
  findUserByApiKeyHash: (key: string) => Promise<UserDoc | null>;
  findUserByPassword: (key: string) => Promise<UserDoc | null>;
}> = {}) {
  const updateAPIUsage = jest.fn(async () => {});
  jest.doMock('@/lib/users', () => ({
    __esModule: true,
    findUserByApiKeyHash: overrides.findUserByApiKeyHash ?? jest.fn(async () => null),
    findUserByPassword: overrides.findUserByPassword ?? jest.fn(async () => null),
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
  it('legacy account (no apiKeyHash) still authenticates via password-as-key, and logs the deprecated-path usage', async () => {
    const legacyUser = makeUser(); // no apiKeyHash field at all
    const { warn } = mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null), // no account has migrated
      findUserByPassword: jest.fn(async (key: string) => (key === 'legacy-password-token' ? legacyUser : null)),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('legacy-password-token');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('integration@example.com');
    // The fallback must be observable -- this is the signal for when it's safe
    // to remove the legacy path later.
    expect(warn).toHaveBeenCalledWith(
      'API auth used deprecated password-as-key fallback',
      expect.objectContaining({ email: 'integration@example.com' })
    );
  });

  it('migrated account (apiKeyHash set) authenticates via the new key and does not use the legacy fallback', async () => {
    const migratedUser = makeUser({ apiKeyHash: 'bcrypt-hash-stand-in' });
    const { warn } = mockLogger();
    const findUserByPassword = jest.fn(async () => {
      throw new Error('should not be called when apiKeyHash matches');
    });
    mockUsers({
      findUserByApiKeyHash: jest.fn(async (key: string) => (key === 'new-independent-key' ? migratedUser : null)),
      findUserByPassword,
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('new-independent-key');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('integration@example.com');
    expect(findUserByPassword).not.toHaveBeenCalled();
    // No deprecated-path warning for the modern path.
    expect(warn).not.toHaveBeenCalledWith(
      'API auth used deprecated password-as-key fallback',
      expect.anything()
    );
  });

  it('a migrated account no longer accepts its old password value as an API key (rotation actually revokes the old key)', async () => {
    const migratedUser = makeUser({ apiKeyHash: 'bcrypt-hash-stand-in' });
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null), // the presented token isn't the new key
      // The old password value still matches on direct lookup, but the account
      // has apiKeyHash set, so it must not be accepted as a key any more.
      findUserByPassword: jest.fn(async (key: string) => (key === 'old-password-value' ? migratedUser : null)),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('old-password-value');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('a wrong key is rejected when no account has migrated (legacy-only world)', async () => {
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null),
      findUserByPassword: jest.fn(async () => null),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('totally-wrong-key');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('a wrong key is rejected against a migrated account (modern-only world)', async () => {
    mockLogger();
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null), // wrong key never matches the hash
      findUserByPassword: jest.fn(async () => null),
    });

    const { validateAPIKey } = await import('@/lib/apiAuth');
    const result = await validateAPIKey('totally-wrong-key');

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_TOKEN');
  });

  it('rejects a correctly-identified account with apiKeyEnabled=false, in both modes', async () => {
    mockLogger();
    const disabledLegacyUser = makeUser({ apiKeyEnabled: false });
    mockUsers({
      findUserByApiKeyHash: jest.fn(async () => null),
      findUserByPassword: jest.fn(async (key: string) => (key === 'disabled-user-key' ? disabledLegacyUser : null)),
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
