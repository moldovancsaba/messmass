import {
  getCachedReportSnapshot,
  saveReportSnapshot,
  invalidateReportSnapshot,
} from '@/lib/reportSnapshotManager';

const inMemoryStore = new Map<string, any>();

jest.mock('@/lib/mongodb', () => {
  return Promise.resolve({
    db: () => ({
      collection: (name: string) => {
        if (name !== 'report_snapshots') {
          throw new Error(`Unexpected collection: ${name}`);
        }
        return {
          findOne: jest.fn(async (query: any) => {
            const key = `${query.scopeType}:${query.scopeIdentifier}:${query.sportFilter}`;
            const doc = inMemoryStore.get(key);
            if (!doc) return null;
            if (query.expiresAt?.$gt && doc.expiresAt <= query.expiresAt.$gt) {
              return null;
            }
            return doc;
          }),
          updateOne: jest.fn(async (filter: any, update: any, options: any) => {
            const key = `${filter.scopeType}:${filter.scopeIdentifier}:${filter.sportFilter}`;
            inMemoryStore.set(key, update.$set);
            return { acknowledged: true, upsertedCount: 1 };
          }),
          deleteMany: jest.fn(async (filter: any) => {
            for (const [key, doc] of Array.from(inMemoryStore.entries())) {
              if (doc.scopeType === filter.scopeType && doc.scopeIdentifier === filter.scopeIdentifier) {
                inMemoryStore.delete(key);
              }
            }
            return { acknowledged: true, deletedCount: 1 };
          }),
        };
      },
    }),
  });
});

describe('ReportSnapshotManager (Materialized SSR Cache & Multi-Tenant Fencing)', () => {
  beforeEach(() => {
    inMemoryStore.clear();
  });

  const testScope = {
    scopeType: 'hashtag' as const,
    scopeIdentifier: 'test-cache-scope',
    sportFilter: 'all',
  };

  const dummyReportData: any = {
    success: true,
    scope: {
      type: 'hashtag',
      id: 'test-cache-scope',
      name: '#test-cache-scope',
      organizationId: '68eea8f3f5fff60e66413aba',
    },
    summary: { totalPhotos: 100 },
    sports: ['Football'],
    timeline: [],
    funnel: [],
    matches: [],
  };

  it('saves snapshot with TTL and retrieves it from cache', async () => {
    await saveReportSnapshot(testScope, dummyReportData, 60);

    const cached = await getCachedReportSnapshot(testScope);
    expect(cached).not.toBeNull();
    expect(cached?.scope?.id).toBe('test-cache-scope');
    expect(cached?.summary.totalPhotos).toBe(100);
  });

  it('invalidates cache correctly', async () => {
    await saveReportSnapshot(testScope, dummyReportData, 60);
    await invalidateReportSnapshot(testScope);

    const cached = await getCachedReportSnapshot(testScope);
    expect(cached).toBeNull();
  });
});
