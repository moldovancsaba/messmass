// tests/page-passwords-authorization.test.ts
// WHAT: Coverage for finding F-MM-01 (messmass issue #376) -- GET/DELETE
//     /api/page-passwords previously authorized on requireSession() alone,
//     letting any signed-in account (including the guest role) read or strip
//     page-password protection off any partner/organization/project's report
//     link with no ownership check.
// WHY: Proves resolveOwnerScope's per-pageType dispatch and the resulting
//     authorization gate deny a caller with no relationship to the resolved
//     scope, allow one with a genuine relationship exactly as before, and fail
//     closed when ownership cannot be resolved at all.

import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

type FakePartner = { _id: ObjectId; viewSlug?: string; legacyViewSlugs?: string[]; organizationId?: ObjectId };
type FakeOrganization = { _id: ObjectId };
type FakeProject = { _id: ObjectId; viewSlug?: string; editSlug?: string };
type FakePagePasswordDoc = { pageId: string; pageType: string; passwordHash?: string };

function buildMockDb(opts: {
  partner?: FakePartner | null;
  organization?: FakeOrganization | null;
  project?: FakeProject | null;
  pagePasswordDoc?: FakePagePasswordDoc | null;
}) {
  return {
    collection: (name: string) => {
      if (name === 'partners') {
        return {
          findOne: jest.fn(async (query: Record<string, unknown>) => {
            const partner = opts.partner;
            if (!partner) return null;
            if (query._id) return partner;
            if (query.viewSlug && query.viewSlug === partner.viewSlug) return partner;
            if (query.legacyViewSlugs && partner.legacyViewSlugs?.includes(query.legacyViewSlugs as string)) return partner;
            return null;
          }),
        };
      }
      if (name === 'organizations') {
        return {
          findOne: jest.fn(async (query: Record<string, unknown>) => {
            if (!opts.organization) return null;
            return query._id ? opts.organization : null;
          }),
        };
      }
      if (name === 'projects') {
        return {
          findOne: jest.fn(async (query: Record<string, unknown>) => {
            const project = opts.project;
            if (!project) return null;
            const clauses = (query.$or as Record<string, unknown>[] | undefined) ?? [query];
            for (const clause of clauses) {
              if (clause._id) return project;
              if (clause.viewSlug && clause.viewSlug === project.viewSlug) return project;
              if (clause.editSlug && clause.editSlug === project.editSlug) return project;
            }
            return null;
          }),
        };
      }
      if (name === 'page_passwords') {
        return {
          findOne: jest.fn(async (query: Record<string, unknown>) => {
            const doc = opts.pagePasswordDoc;
            if (!doc) return null;
            return query.pageId === doc.pageId && query.pageType === doc.pageType ? doc : null;
          }),
          deleteMany: jest.fn(async () => ({ deletedCount: opts.pagePasswordDoc ? 1 : 0 })),
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    },
  };
}

function mockDbModules(db: ReturnType<typeof buildMockDb>) {
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({ db: jest.fn(() => db) }),
  }));
  jest.doMock('@/lib/config', () => ({
    __esModule: true,
    default: { dbName: 'messmass-test' },
  }));
}

describe('resolveOwnerScope', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('partner-report resolves to organization scope when the partner belongs to one', async () => {
    const partner: FakePartner = { _id: new ObjectId(), organizationId: new ObjectId() };
    mockDbModules(buildMockDb({ partner }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(partner._id.toString(), 'partner-report');

    expect(scope).toEqual({
      kind: 'organization',
      organizationId: partner.organizationId!.toString(),
      partnerId: partner._id.toString(),
    });
  });

  it('partner-report resolves to partner scope when the partner has no organization', async () => {
    const partner: FakePartner = { _id: new ObjectId() };
    mockDbModules(buildMockDb({ partner }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(partner._id.toString(), 'partner-report');

    expect(scope).toEqual({ kind: 'partner', partnerId: partner._id.toString() });
  });

  it('partner-edit resolves through the same partner dispatch as partner-report', async () => {
    const partner: FakePartner = { _id: new ObjectId(), organizationId: new ObjectId() };
    mockDbModules(buildMockDb({ partner }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(partner._id.toString(), 'partner-edit');

    expect(scope).toEqual({
      kind: 'organization',
      organizationId: partner.organizationId!.toString(),
      partnerId: partner._id.toString(),
    });
  });

  it('organization-report resolves directly to the organization id', async () => {
    const organization: FakeOrganization = { _id: new ObjectId() };
    mockDbModules(buildMockDb({ organization }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(organization._id.toString(), 'organization-report');

    expect(scope).toEqual({ kind: 'organization', organizationId: organization._id.toString() });
  });

  it('organization-edit resolves directly to the organization id', async () => {
    const organization: FakeOrganization = { _id: new ObjectId() };
    mockDbModules(buildMockDb({ organization }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(organization._id.toString(), 'organization-edit');

    expect(scope).toEqual({ kind: 'organization', organizationId: organization._id.toString() });
  });

  it('event-report resolves to the owning project via viewSlug', async () => {
    const project: FakeProject = { _id: new ObjectId(), viewSlug: 'a-view-slug' };
    mockDbModules(buildMockDb({ project }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope('a-view-slug', 'event-report');

    expect(scope).toEqual({ kind: 'project', projectId: project._id.toString() });
  });

  it('edit resolves to the owning project via editSlug', async () => {
    const project: FakeProject = { _id: new ObjectId(), editSlug: 'an-edit-slug' };
    mockDbModules(buildMockDb({ project }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope('an-edit-slug', 'edit');

    expect(scope).toEqual({ kind: 'project', projectId: project._id.toString() });
  });

  it('filter has no single owning partner/organization/project and resolves unresolved', async () => {
    mockDbModules(buildMockDb({}));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope('some-saved-filter-slug', 'filter');

    expect(scope).toEqual({ kind: 'unresolved' });
  });

  it('hashtag has no single owning partner/organization/project and resolves unresolved', async () => {
    mockDbModules(buildMockDb({}));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope('worldcup', 'hashtag');

    expect(scope).toEqual({ kind: 'unresolved' });
  });

  it('resolves unresolved for an orphaned/malformed reference (organization-report with no matching org)', async () => {
    mockDbModules(buildMockDb({ organization: null }));

    const { resolveOwnerScope } = await import('@/lib/pagePasswordAccess');
    const scope = await resolveOwnerScope(new ObjectId().toString(), 'organization-report');

    expect(scope).toEqual({ kind: 'unresolved' });
  });
});

type AdminUserLike = { id: string; role: string; organizationIds?: string[] };

function mockAuthModules(opts: {
  user: AdminUserLike | null;
  hasPageAccess: boolean;
  orgAccessGranted: boolean;
}) {
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => opts.user),
  }));
  jest.doMock('@/lib/pageAccess', () => ({
    __esModule: true,
    hasPageAccess: jest.fn(async () => opts.hasPageAccess),
    PAGE_ACCESS_COOKIE: 'page-access',
    mintPageAccessToken: jest.fn(() => 'token'),
    pageAccessCookieOptions: jest.fn(() => ({})),
  }));
  jest.doMock('@/lib/auth/orgGuard', () => ({
    __esModule: true,
    validateOrganizationAccess: jest.fn(async () => (opts.orgAccessGranted ? opts.user : null)),
  }));
}

function makeRequest(pageId: string, pageType: string, method: 'GET' | 'DELETE') {
  return new NextRequest(
    `http://localhost/api/page-passwords?pageId=${encodeURIComponent(pageId)}&pageType=${encodeURIComponent(pageType)}`,
    { method }
  );
}

describe('GET/DELETE /api/page-passwords authorization gate', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('denies a guest with no relationship to a partner-report page (403 FORBIDDEN)', async () => {
    const partner: FakePartner = { _id: new ObjectId() };
    mockDbModules(buildMockDb({ partner }));
    mockAuthModules({ user: { id: 'guest-1', role: 'guest' }, hasPageAccess: false, orgAccessGranted: false });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');

    const getRes = await GET(makeRequest(partner._id.toString(), 'partner-report', 'GET'));
    expect(getRes.status).toBe(403);
    const getBody = await getRes.json();
    expect(getBody).toEqual({ success: false, error: 'You do not have access to this page.', code: 'FORBIDDEN' });

    const deleteRes = await DELETE(makeRequest(partner._id.toString(), 'partner-report', 'DELETE'));
    expect(deleteRes.status).toBe(403);
    const deleteBody = await deleteRes.json();
    expect(deleteBody).toEqual({ success: false, error: 'You do not have access to this page.', code: 'FORBIDDEN' });
  });

  it('allows a guest with a genuine page-access relationship, unchanged from today (200)', async () => {
    const partner: FakePartner = { _id: new ObjectId() };
    const pagePasswordDoc: FakePagePasswordDoc = { pageId: partner._id.toString(), pageType: 'partner-report', passwordHash: 'hash' };
    mockDbModules(buildMockDb({ partner, pagePasswordDoc }));
    mockAuthModules({ user: { id: 'guest-2', role: 'guest' }, hasPageAccess: true, orgAccessGranted: false });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');

    const getRes = await GET(makeRequest(partner._id.toString(), 'partner-report', 'GET'));
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.isProtected).toBe(true);

    const deleteRes = await DELETE(makeRequest(partner._id.toString(), 'partner-report', 'DELETE'));
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody).toEqual({ success: true, removed: true });
  });

  it('allows a caller with a genuine page-access grant on an org-assigned partner, even with no org membership (200)', async () => {
    const partner: FakePartner = { _id: new ObjectId(), organizationId: new ObjectId() };
    const pagePasswordDoc: FakePagePasswordDoc = { pageId: partner._id.toString(), pageType: 'partner-report', passwordHash: 'hash' };
    mockDbModules(buildMockDb({ partner, pagePasswordDoc }));
    mockAuthModules({ user: { id: 'guest-3', role: 'guest' }, hasPageAccess: true, orgAccessGranted: false });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');

    const getRes = await GET(makeRequest(partner._id.toString(), 'partner-report', 'GET'));
    expect(getRes.status).toBe(200);

    const deleteRes = await DELETE(makeRequest(partner._id.toString(), 'partner-report', 'DELETE'));
    expect(deleteRes.status).toBe(200);
  });

  it('denies an admin assigned to a different organization (403 FORBIDDEN)', async () => {
    const partner: FakePartner = { _id: new ObjectId(), organizationId: new ObjectId() };
    mockDbModules(buildMockDb({ partner }));
    mockAuthModules({
      user: { id: 'admin-1', role: 'admin', organizationIds: [new ObjectId().toString()] },
      hasPageAccess: false,
      orgAccessGranted: false,
    });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');

    const getRes = await GET(makeRequest(partner._id.toString(), 'partner-report', 'GET'));
    expect(getRes.status).toBe(403);

    const deleteRes = await DELETE(makeRequest(partner._id.toString(), 'partner-report', 'DELETE'));
    expect(deleteRes.status).toBe(403);
  });

  it('allows superadmin regardless of relationship, including an unresolvable scope', async () => {
    mockDbModules(buildMockDb({}));
    mockAuthModules({ user: { id: 'super-1', role: 'superadmin' }, hasPageAccess: false, orgAccessGranted: false });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');

    const getRes = await GET(makeRequest('worldcup', 'hashtag', 'GET'));
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);

    const deleteRes = await DELETE(makeRequest('worldcup', 'hashtag', 'DELETE'));
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);
  });

  it('leaves the unauthenticated 401 UNAUTHENTICATED path unchanged', async () => {
    mockDbModules(buildMockDb({}));
    mockAuthModules({ user: null, hasPageAccess: false, orgAccessGranted: false });

    const { GET, DELETE } = await import('@/app/api/page-passwords/route');
    const { hasPageAccess } = await import('@/lib/pageAccess');
    const { validateOrganizationAccess } = await import('@/lib/auth/orgGuard');

    const getRes = await GET(makeRequest('irrelevant', 'partner-report', 'GET'));
    expect(getRes.status).toBe(401);
    const getBody = await getRes.json();
    expect(getBody.code).toBe('UNAUTHENTICATED');

    const deleteRes = await DELETE(makeRequest('irrelevant', 'partner-report', 'DELETE'));
    expect(deleteRes.status).toBe(401);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.code).toBe('UNAUTHENTICATED');

    expect(hasPageAccess).not.toHaveBeenCalled();
    expect(validateOrganizationAccess).not.toHaveBeenCalled();
  });
});
