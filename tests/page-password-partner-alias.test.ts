
// Hashes generated once at load, so the fixtures exercise the real bcrypt path
// rather than asserting against a hard-coded digest that would silently rot if
// the cost factor changed.
const bcryptLib = require('bcryptjs');
const SECRET_HASH: string = bcryptLib.hashSync('secret', 12);
const EXISTING_SECRET_HASH: string = bcryptLib.hashSync('existing-secret', 12);

describe('partner page password validation', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('falls back from a legacy partner slug to the canonical slug password record', async () => {
    const mockUpdateOne = jest.fn(async () => ({ modifiedCount: 1 }));
    const canonicalPageId = '11329474-28a3-4089-8d28-1938689339a1::variant=this-year';
    const mockPagePasswordsFindOne = jest.fn(async (query: Record<string, string>) => {
      if (query.pageId === 'zte-football-club::variant=this-year') {
        return null;
      }

      if (query.pageId === canonicalPageId && query.pageType === 'partner-report') {
        return {
          pageId: canonicalPageId,
          pageType: 'partner-report',
          // Hashed, because a plaintext `password` field is no longer a valid
          // credential: every pre-existing page password was retrievable by
          // anonymous callers, so those values are void and must be rotated.
          // bcrypt hash of 'secret', cost 12.
          passwordHash: SECRET_HASH,
          usageCount: 2,
        };
      }

      return null;
    });
    const mockPartnersFindOne = jest.fn(async (query: Record<string, string>) => {
      if (query.viewSlug === 'zte-football-club') {
        return null;
      }

      if (query.legacyViewSlugs === 'zte-football-club') {
        return {
          _id: 'partner-1',
          viewSlug: '11329474-28a3-4089-8d28-1938689339a1',
          legacyViewSlugs: ['zte-football-club'],
        };
      }

      return null;
    });

    const mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'page_passwords') {
          return {
            findOne: mockPagePasswordsFindOne,
            updateOne: mockUpdateOne,
          };
        }

        if (name === 'partners') {
          return {
            findOne: mockPartnersFindOne,
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    };

    jest.doMock('@/lib/mongodb', () => ({
      __esModule: true,
      default: Promise.resolve({
        db: jest.fn(() => mockDb),
      }),
    }));
    jest.doMock('@/lib/config', () => ({
      __esModule: true,
      default: {
        dbName: 'messmass-test',
      },
    }));

    const { validatePagePassword } = await import('@/lib/pagePassword');

    const isValid = await validatePagePassword(
      'zte-football-club::variant=this-year',
      'partner-report',
      'secret'
    );

    expect(isValid).toBe(true);
    expect(mockPagePasswordsFindOne).toHaveBeenNthCalledWith(1, {
      pageId: 'zte-football-club::variant=this-year',
      pageType: 'partner-report',
    });
    expect(mockPagePasswordsFindOne).toHaveBeenNthCalledWith(2, {
      pageId: canonicalPageId,
      pageType: 'partner-report',
    });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { pageId: canonicalPageId, pageType: 'partner-report' },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: expect.any(String) },
      }
    );
  });

  it('returns canonical partner share links and preserves the existing password when a legacy identifier is used', async () => {
    const legacyPageId = '6a05b394767174e927c63141';
    const canonicalPageId = '54918373-b5f8-4bfd-b300-7981c555966b';
    const createdAt = '2026-06-30T00:00:00.000Z';
    const legacyPasswordRecord = {
      _id: { toString: () => 'legacy-password' },
      pageId: legacyPageId,
      pageType: 'partner-report',
      passwordHash: EXISTING_SECRET_HASH,
      createdAt,
      usageCount: 4,
      lastUsedAt: '2026-06-30T01:00:00.000Z',
    };
    let canonicalPasswordRecord: any = null;

    const mockUpdateOne = jest.fn(async (filter: Record<string, string>, update: Record<string, any>) => {
      if (filter.pageId === canonicalPageId && update.$setOnInsert) {
        canonicalPasswordRecord = {
          _id: { toString: () => 'canonical-password' },
          ...update.$setOnInsert,
        };
      }

      return { acknowledged: true };
    });

    const mockPagePasswordsFindOne = jest.fn(async (query: Record<string, string>) => {
      if (query.pageId === canonicalPageId && query.pageType === 'partner-report') {
        return canonicalPasswordRecord;
      }

      if (query.pageId === legacyPageId && query.pageType === 'partner-report') {
        return legacyPasswordRecord;
      }

      return null;
    });

    const mockPartnersFindOne = jest.fn(async (query: Record<string, unknown>) => {
      if (query._id) {
        return {
          _id: legacyPageId,
          viewSlug: canonicalPageId,
          legacyViewSlugs: ['mtk-budapest'],
        };
      }

      return null;
    });

    const mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'page_passwords') {
          return {
            findOne: mockPagePasswordsFindOne,
            updateOne: mockUpdateOne,
          };
        }

        if (name === 'partners') {
          return {
            findOne: mockPartnersFindOne,
          };
        }

        throw new Error(`Unexpected collection ${name}`);
      }),
    };

    jest.doMock('@/lib/mongodb', () => ({
      __esModule: true,
      default: Promise.resolve({
        db: jest.fn(() => mockDb),
      }),
    }));
    jest.doMock('@/lib/config', () => ({
      __esModule: true,
      default: {
        dbName: 'messmass-test',
      },
    }));

    const { getOrCreatePagePassword, generateShareableLink } = await import('@/lib/pagePassword');

    const passwordRecord = await getOrCreatePagePassword(legacyPageId, 'partner-report');
    const shareableLink = await generateShareableLink(legacyPageId, 'partner-report', 'https://www.messmass.com');

    expect(passwordRecord.pageId).toBe(canonicalPageId);
    // WHAT: An existing record yields no plaintext.
    // WHY: Passwords are stored only as a bcrypt hash and revealed exactly once,
    //     at generation. Being unable to re-read one is the security property, not
    //     a gap — an endpoint that could return it is precisely the flaw that made
    //     every configured password retrievable by anonymous callers.
    expect(passwordRecord.password).toBe('');
    expect(shareableLink.url).toBe(`https://www.messmass.com/partner-report/${canonicalPageId}`);
    expect(shareableLink.password).toBe('');
    // The invariant this test actually guards: migrating a legacy identifier to
    // the canonical one carries the existing credential across rather than
    // silently regenerating it and invalidating live share links. Asserted on the
    // hash, since that is now the stored credential.
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { pageId: canonicalPageId, pageType: 'partner-report' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({ passwordHash: EXISTING_SECRET_HASH }),
      }),
      { upsert: true }
    );
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { pageId: canonicalPageId, pageType: 'partner-report' },
      {
        $setOnInsert: {
          pageId: canonicalPageId,
          pageType: 'partner-report',
          passwordHash: EXISTING_SECRET_HASH,
          createdAt,
          expiresAt: undefined,
          usageCount: 4,
          lastUsedAt: '2026-06-30T01:00:00.000Z',
        },
      },
      { upsert: true }
    );
  });
});
