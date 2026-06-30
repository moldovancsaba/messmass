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
          password: 'secret',
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
});
