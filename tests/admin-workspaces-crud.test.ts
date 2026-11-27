import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { adminNavSections, getSidebarNavGroups } from '@/lib/adminNavigation';

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('Milestone 16 — Single-Entity Workspace Endpoints & Consolidated Sidebar', () => {
  it('consolidates all 6 admin sections into 14 sidebar groups (+ Overview = 15 top-level items)', () => {
    const groups = adminNavSections.flatMap((section) => getSidebarNavGroups(section));
    expect(groups).toHaveLength(14);

    const allUnderlyingPaths = adminNavSections.flatMap((s) => s.items.map((i) => i.path));
    const groupedPaths = groups.flatMap((g) => [g.parent.path, ...g.children.map((c) => c.path)]);
    expect(new Set(groupedPaths)).toEqual(new Set(allUnderlyingPaths));
  });

  it('rejects unauthenticated GET and PUT on /api/partners/[id] and /api/organizations/[id] with 401', async () => {
    jest.doMock('@/lib/auth', () => ({
      __esModule: true,
      getAdminUser: jest.fn(async () => null),
    }));
    jest.doMock('@/lib/db', () => ({
      __esModule: true,
      getDb: jest.fn(),
    }));

    const partnerRoute = await import('@/app/api/partners/[id]/route');
    const orgRoute = await import('@/app/api/organizations/[id]/route');

    const pGet = await partnerRoute.GET(new NextRequest('http://localhost/api/partners/123'), {
      params: Promise.resolve({ id: '65a000000000000000000001' }),
    });
    expect(pGet.status).toBe(401);

    const oGet = await orgRoute.GET(new NextRequest('http://localhost/api/organizations/123'), {
      params: Promise.resolve({ id: '65a000000000000000000002' }),
    });
    expect(oGet.status).toBe(401);
  });

  it('returns 400 on malformed ObjectId for PUT /api/partners/[id] and PUT /api/organizations/[id]', async () => {
    jest.doMock('@/lib/apiGuards', () => ({
      __esModule: true,
      requireSession: jest.fn(async () => null),
      requireAdmin: jest.fn(async () => null),
    }));
    jest.doMock('@/lib/db', () => ({
      __esModule: true,
      getDb: jest.fn(),
    }));

    const partnerRoute = await import('@/app/api/partners/[id]/route');
    const orgRoute = await import('@/app/api/organizations/[id]/route');

    const pPut = await partnerRoute.PUT(
      new NextRequest('http://localhost/api/partners/bad-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'not-an-objectid' }) }
    );
    expect(pPut.status).toBe(400);

    const oPut = await orgRoute.PUT(
      new NextRequest('http://localhost/api/organizations/bad-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'not-an-objectid' }) }
    );
    expect(oPut.status).toBe(400);
  });

  it('returns 404 when partner or organization does not exist and 200 with hub payload + surgical $set on valid IDs', async () => {
    const partnerId = new ObjectId('65a000000000000000000011');
    const orgId = new ObjectId('65a000000000000000000022');
    const projectId = new ObjectId('65a000000000000000000033');
    const recordedUpdates: Array<{ coll: string; update: Record<string, unknown> }> = [];

    const mockCollections: Record<string, any> = {
      partners: {
        doc: {
          _id: partnerId,
          name: 'Ferencvárosi TC',
          emoji: '⚽',
          viewSlug: 'ftc',
          organizationId: orgId,
          status: 'active',
        },
        list: [
          {
            _id: partnerId,
            name: 'Ferencvárosi TC',
            emoji: '⚽',
            viewSlug: 'ftc',
            organizationId: orgId,
            status: 'active',
          },
        ],
      },
      organizations: {
        doc: {
          _id: orgId,
          name: 'MLSZ',
          slug: 'mlsz',
          orgType: 'federation',
          status: 'active',
          metadata: {},
        },
      },
      projects: {
        list: [
          {
            _id: projectId,
            eventName: 'Ferencvárosi TC x Újpest FC',
            eventDate: '2026-10-10',
            partner1Id: partnerId,
            organizationId: orgId,
            stats: { totalFans: 1500, images: 320 },
          },
        ],
      },
    };

    jest.doMock('@/lib/apiGuards', () => ({
      __esModule: true,
      requireSession: jest.fn(async () => null),
      requireAdmin: jest.fn(async () => null),
    }));
    jest.doMock('@/lib/clubLogoResolver', () => ({
      __esModule: true,
      loadCentralizedClubRegistry: jest.fn(async () => ({
        resolveLogo: () => 'https://cdn.example/logo.svg',
      })),
      slugifyClub: (s: string) => s.toLowerCase(),
      syncClubAssetAcrossEntities: jest.fn(async () => ({ updatedPartnerIds: [], updatedOrgIds: [] })),
    }));
    jest.doMock('@/lib/v3/syncEngine', () => ({
      __esModule: true,
      syncPartnerToV3Entity: jest.fn(async () => undefined),
    }));
    jest.doMock('@/lib/cameraThemeNotify', () => ({
      __esModule: true,
      notifyCameraPartnerChanged: jest.fn(async () => undefined),
    }));
    jest.doMock('@/lib/db', () => ({
      __esModule: true,
      getDb: jest.fn(async () => ({
        collection: (name: string) => ({
          findOne: jest.fn(async (query: any) => {
            if (name === 'partners') {
              return String(query?._id) === partnerId.toString() ? mockCollections.partners.doc : null;
            }
            if (name === 'organizations') {
              return String(query?._id) === orgId.toString() ? mockCollections.organizations.doc : null;
            }
            return null;
          }),
          find: jest.fn(() => ({
            sort: () => ({
              limit: () => ({
                toArray: async () => mockCollections[name]?.list || [],
              }),
              toArray: async () => mockCollections[name]?.list || [],
            }),
            toArray: async () => mockCollections[name]?.list || [],
          })),
          updateOne: jest.fn(async (_filter: any, update: any) => {
            recordedUpdates.push({ coll: name, update });
            return { matchedCount: 1, modifiedCount: 1 };
          }),
          updateMany: jest.fn(async () => ({ modifiedCount: 1 })),
        }),
      })),
    }));

    const partnerRoute = await import('@/app/api/partners/[id]/route');
    const orgRoute = await import('@/app/api/organizations/[id]/route');

    const missingPartner = await partnerRoute.GET(new NextRequest('http://localhost/api/partners/missing'), {
      params: Promise.resolve({ id: '65a000000000000000000099' }),
    });
    expect(missingPartner.status).toBe(404);

    const partnerRes = await partnerRoute.GET(new NextRequest('http://localhost/api/partners/ok'), {
      params: Promise.resolve({ id: partnerId.toString() }),
    });
    expect(partnerRes.status).toBe(200);
    const partnerJson = await partnerRes.json();
    expect(partnerJson.success).toBe(true);
    expect(partnerJson.partner.name).toBe('Ferencvárosi TC');
    expect(partnerJson.events).toHaveLength(1);
    expect(partnerJson.stats.totalFans).toBe(1500);

    const partnerPut = await partnerRoute.PUT(
      new NextRequest('http://localhost/api/partners/ok', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Ferencvárosi TC', contactEmail: 'club@ftc.hu' }),
      }),
      { params: Promise.resolve({ id: partnerId.toString() }) }
    );
    expect(partnerPut.status).toBe(200);
    expect(recordedUpdates.some((u) => u.coll === 'partners' && Boolean(u.update.$set))).toBe(true);

    const orgRes = await orgRoute.GET(new NextRequest('http://localhost/api/organizations/ok'), {
      params: Promise.resolve({ id: orgId.toString() }),
    });
    expect(orgRes.status).toBe(200);
    const orgJson = await orgRes.json();
    expect(orgJson.success).toBe(true);
    expect(orgJson.organization.name).toBe('MLSZ');
    expect(orgJson.memberClubs).toHaveLength(1);
    expect(orgJson.sanctionedMatches).toHaveLength(1);
  });
});
