import { resolveScopeProjectIds } from "@/lib/interactiveReportAggregator";
import { getCachedReportSnapshot, saveReportSnapshot } from "@/lib/reportSnapshotManager";

const mockSnapshotStore = new Map<string, any>();
const mockPartners = [
  {
    _id: "694a96990ad78323bea10660",
    name: "Szerencsejáték Zrt.",
    viewSlug: "ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd",
    organizationId: "org_szrt",
  },
  {
    _id: "partner-debrecen",
    name: "Debreceni VSC",
    viewSlug: "debreceni-vsc",
    organizationId: "org_dvsc",
  },
];

const mockProjects = [
  {
    _id: "proj-1",
    eventName: "NOVEMBER Statisztika",
    hashtags: ["tippmixreport2026"],
    organizationId: "org_szrt",
  },
  {
    _id: "proj-2",
    eventName: "DVSC vs FTC",
    hashtags: ["dvsc", "tippmixreport2026"],
    organizationId: "org_dvsc",
  },
];

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => ({
        findOne: jest.fn(async (q: any) => {
          if (name === "report_snapshots") {
            const cleanId = (q.$or ? q.$or[0].scopeIdentifier : q.scopeIdentifier) || q.identifier;
            const org = q.organizationId || "global";
            const key = `${org}:${q.scopeType}:${cleanId}:${q.sportFilter}`;
            return mockSnapshotStore.get(key) || null;
          }
          if (name === "partners") {
            if (q.organizationId && q.organizationId !== "org_szrt" && q.organizationId !== "org_dvsc") {
              return null;
            }
            if (q.$or) {
              for (const cond of q.$or) {
                if (cond.viewSlug === "ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd" || cond.name?.test?.("szerencsejáték")) {
                  return mockPartners[0];
                }
                if (cond.viewSlug === "debreceni-vsc") {
                  return mockPartners[1];
                }
              }
            }
          }
          return null;
        }),
        find: jest.fn((q: any) => ({
          sort: jest.fn().mockReturnThis(),
          toArray: jest.fn(async () => {
            if (name === "projects") {
              let res = [...mockProjects];
              if (q.organizationId) {
                res = res.filter((p) => p.organizationId === q.organizationId);
              }
              return res;
            }
            if (name === "partners") return mockPartners;
            return [];
          }),
        })),
        replaceOne: jest.fn(async (filter: any, doc: any) => {
          const key = `${doc.organizationId}:${doc.scopeType}:${doc.scopeIdentifier}:${doc.sportFilter}`;
          mockSnapshotStore.set(key, doc);
          return { acknowledged: true };
        }),
        deleteMany: jest.fn(async () => ({ acknowledged: true })),
      }),
    }),
  }),
}));

describe("Tenant Isolation Verification (INV-001)", () => {
  const ORG_SZRT = "org_szrt";
  const ORG_FOREIGN = "org_foreign_partner";
  const ORG_DVSC = "org_dvsc";

  beforeEach(() => {
    mockSnapshotStore.clear();
  });

  it("prohibits foreign tenant from resolving Szerencsejáték hashtag scope events", async () => {
    const res = await resolveScopeProjectIds("hashtag", "tippmixreport2026", ORG_FOREIGN);
    expect(res.resolvedEventIds).toHaveLength(0);
    expect(res.campaignProjects).toHaveLength(0);
    expect(res.scopeMetadata.totalEvents).toBe(0);
  });

  it("strictly fences partner scope resolution by compound organizationId", async () => {
    // DVSC tenant accessing DVSC partner
    const authRes = await resolveScopeProjectIds("partner", "debreceni-vsc", ORG_DVSC);
    expect(authRes.partner).not.toBeNull();
    expect(authRes.partner.name).toBe("Debreceni VSC");

    // Foreign tenant attempting to access DVSC partner
    const foreignRes = await resolveScopeProjectIds("partner", "debreceni-vsc", ORG_FOREIGN);
    expect(foreignRes.partner).toBeNull();
    expect(foreignRes.resolvedEventIds).toHaveLength(0);
  });

  it("strictly partitions snapshot cache access across tenant boundaries", async () => {
    // Save snapshot for ORG_SZRT
    await saveReportSnapshot(
      {
        scopeType: "hashtag",
        scopeIdentifier: "tippmixreport2026",
        organizationId: ORG_SZRT,
      },
      { success: true, summary: { totalPhotos: 42000 } } as any
    );

    // Read by authorized tenant
    const authSnapshot = await getCachedReportSnapshot({
      scopeType: "hashtag",
      scopeIdentifier: "tippmixreport2026",
      organizationId: ORG_SZRT,
    });
    expect(authSnapshot).not.toBeNull();
    expect(authSnapshot?.summary.totalPhotos).toBe(42000);

    // Read by foreign tenant
    const foreignSnapshot = await getCachedReportSnapshot({
      scopeType: "hashtag",
      scopeIdentifier: "tippmixreport2026",
      organizationId: ORG_FOREIGN,
    });
    expect(foreignSnapshot).toBeNull();
  });
});
