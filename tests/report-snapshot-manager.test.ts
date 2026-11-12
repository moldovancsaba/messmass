import {
  getCachedReportSnapshot,
  saveReportSnapshot,
  getOrGenerateSnapshot,
  invalidateReportSnapshot,
} from "@/lib/reportSnapshotManager";

const mockSnapshotStore = new Map<string, any>();
const mockReplaceOne = jest.fn(async (filter: any, doc: any, options: any) => {
  const key = `${doc.organizationId}:${doc.scopeType}:${doc.scopeIdentifier}:${doc.sportFilter}`;
  mockSnapshotStore.set(key, doc);
  return { acknowledged: true, upsertedId: null };
});

const mockFindOne = jest.fn(async (query: any) => {
  const cleanId = (query.$or ? query.$or[0].scopeIdentifier : query.scopeIdentifier) || query.identifier;
  const org = query.organizationId || "global";
  const key = `${org}:${query.scopeType}:${cleanId}:${query.sportFilter}`;
  const doc = mockSnapshotStore.get(key);
  if (!doc) return null;

  if (query.expiresAt && query.expiresAt.$gt) {
    if (new Date(doc.expiresAt) <= query.expiresAt.$gt) {
      return null; // Expired
    }
  }
  return doc;
});

const mockDeleteMany = jest.fn(async (filter: any) => {
  const cleanId = (filter.$or ? filter.$or[0].scopeIdentifier : filter.scopeIdentifier) || filter.identifier;
  const org = filter.organizationId || "global";
  const key = `${org}:${filter.scopeType}:${cleanId}:all`;
  mockSnapshotStore.delete(key);
  return { acknowledged: true, deletedCount: 1 };
});

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        findOne: mockFindOne,
        replaceOne: mockReplaceOne,
        deleteMany: mockDeleteMany,
      }),
    }),
  }),
}));

describe("Materialized Snapshot Cache (RFC-003 / Issue #12)", () => {
  beforeEach(() => {
    mockSnapshotStore.clear();
    jest.clearAllMocks();
  });

  it("only reads current-schema snapshots and fences org-less lookups to the global partition", async () => {
    await getCachedReportSnapshot({ scopeType: "hashtag", scopeIdentifier: "romania" });
    const query = mockFindOne.mock.calls[0][0];
    expect(query.schemaVersion).toBe(4);
    expect(query.organizationId).toBe("global");
  });

  it("stores and retrieves a snapshot with atomic replaceOne and TTL", async () => {
    const mockReport: any = {
      success: true,
      scope: { type: "hashtag", id: "tippmixreport2026" },
      summary: { totalPhotos: 12500 },
      matches: [],
    };

    await saveReportSnapshot(
      {
        scopeType: "hashtag",
        scopeIdentifier: "tippmixreport2026",
        organizationId: "org_szrt",
      },
      mockReport,
      3600
    );

    expect(mockReplaceOne).toHaveBeenCalledTimes(1);
    const [filter, doc, opts] = mockReplaceOne.mock.calls[0];
    expect(opts.upsert).toBe(true);
    expect(doc.organizationId).toBe("org_szrt");
    expect(doc.snapshotVersion).toBe(1);
    expect(doc.metrics).toEqual(mockReport);

    const cached = await getCachedReportSnapshot({
      scopeType: "hashtag",
      scopeIdentifier: "tippmixreport2026",
      organizationId: "org_szrt",
    });

    expect(cached).not.toBeNull();
    expect(cached?.summary.totalPhotos).toBe(12500);
  });

  it("enforces tenant boundary isolation on snapshot retrieval (INV-001)", async () => {
    const mockReport: any = {
      success: true,
      summary: { totalPhotos: 5000 },
    };

    await saveReportSnapshot(
      {
        scopeType: "partner",
        scopeIdentifier: "debreceni-vsc",
        organizationId: "org_dvsc",
      },
      mockReport
    );

    // Tenant B attempts to read Tenant A snapshot
    const crossTenantRead = await getCachedReportSnapshot({
      scopeType: "partner",
      scopeIdentifier: "debreceni-vsc",
      organizationId: "unauthorized_tenant_fradi",
    });

    expect(crossTenantRead).toBeNull();
  });

  it("prevents cache stampede across 50 concurrent requests", async () => {
    let generatorExecutionCount = 0;
    const generator = async () => {
      generatorExecutionCount++;
      // simulate compute latency
      await new Promise((r) => setTimeout(r, 20));
      return {
        success: true,
        summary: { totalPhotos: 9999 },
      } as any;
    };

    // Dispatch 50 concurrent requests simultaneously
    const requests = Array.from({ length: 50 }, () =>
      getOrGenerateSnapshot(
        {
          scopeType: "hashtag",
          scopeIdentifier: "derby2026",
          organizationId: "org_szrt",
        },
        generator
      )
    );

    const results = await Promise.all(requests);

    // Generator must be executed exactly ONCE
    expect(generatorExecutionCount).toBe(1);
    for (const res of results) {
      expect(res).not.toBeNull();
      expect(res?.data.summary.totalPhotos).toBe(9999);
    }
  });

  it("invalidates snapshot on demand and triggers revalidation", async () => {
    await saveReportSnapshot(
      {
        scopeType: "hashtag",
        scopeIdentifier: "tippmixreport2026",
        organizationId: "org_szrt",
      },
      { success: true } as any
    );

    await invalidateReportSnapshot({
      scopeType: "hashtag",
      scopeIdentifier: "tippmixreport2026",
      organizationId: "org_szrt",
    });

    expect(mockDeleteMany).toHaveBeenCalledTimes(1);
    const cachedAfter = await getCachedReportSnapshot({
      scopeType: "hashtag",
      scopeIdentifier: "tippmixreport2026",
      organizationId: "org_szrt",
    });
    expect(cachedAfter).toBeNull();
  });
});
