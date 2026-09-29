// tests/security/editor-write-access.test.ts
// WHAT: Editor saves follow the same access rule as editor loads.
// WHY: Incident 2026-09-27. An event with no edit password opened for its
//     operator (GET /api/projects/edit/[slug] lets anyone holding the edit link
//     in), but every PUT /api/projects returned 401: requireProjectWrite wanted a
//     page-access grant, and only a password ever minted one. The operator typed
//     for hours and nothing was stored. The partner editor had the same split
//     between GET /api/partners/edit/[slug] and PUT /api/partners.
// HOW: The event loader now issues the grant requireProjectWrite looks for when
//     it lets the caller in without a password via the secret edit link. The
//     partner loader does not: a partner's edit slug is its public report slug,
//     so an unprotected partner editor still needs a session or a password to
//     save. Both loaders renew a grant the caller already holds, and both report
//     `canSave` so the editor knows before anyone types. A grant counts only
//     while it is newer than the page's current password, so setting or
//     regenerating a password still locks earlier holders out. These tests
//     drive the real route handlers and guards with the database, the cookie
//     jar and the session mocked, and pin the F-009 property that a bare
//     database id or a public report slug -- neither is a secret -- still
//     writes nothing, variants included. They also pin that a grant from a
//     token signed before per-grant issue times is never renewed or used to
//     save on a protected page, that an event edit password works at either
//     address of the editor (editSlug or _id), and that removing a custom
//     variant's logo is stored.

import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const EDIT_SLUG = '2f1c7a4e-8b3d-4c5e-9f6a-1b2c3d4e5f60';
const OTHER_EDIT_SLUG = '7d9e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f2a';
const PARTNER_SLUG = 'a3b4c5d6-e7f8-4a9b-8c0d-1e2f3a4b5c6d';
const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse('2026-09-27T12:00:00Z');

type Doc = Record<string, any>;

// A password row older than START, so a grant issued at START is newer than it.
const PASSWORD_SET_AT = START - 24 * HOUR_MS;

interface World {
  admin: boolean;
  // The signed-in account's role when `admin` is true (default 'admin').
  role: string;
  jar: Map<string, string>;
  // page_passwords rows by `${pageType}:${pageId}`, valued by createdAt
  // (undefined models a legacy row that has none).
  passwords: Map<string, string | undefined>;
  // bcrypt hashes for the rows a test validates a password against, same keys.
  hashes: Map<string, string>;
  passwordUsage: string[];
  projects: Doc[];
  partners: Doc[];
  variants: Doc[];
  partnerUpdates: Array<{ filter: Doc; update: Doc }>;
  projectUpdates: Array<{ filter: Doc; update: Doc }>;
  variantUpdates: Array<{ id: string; update: Doc }>;
}

// As getOrCreatePagePassword does on create and on regenerate.
function setPassword(world: World, key: string, atMs: number = Date.now()) {
  world.passwords.set(key, new Date(atMs).toISOString());
}

function sameId(a: unknown, b: unknown): boolean {
  return a != null && b != null && String(a) === String(b);
}

function buildDb(world: World) {
  return {
    collection: (name: string) => {
      if (name === 'page_passwords') {
        return {
          findOne: jest.fn(async (q: Doc) => {
            const key = `${q.pageType}:${q.pageId}`;
            if (!world.passwords.has(key)) return null;
            const createdAt = world.passwords.get(key);
            const row: Doc = { _id: 'pw', pageId: q.pageId, pageType: q.pageType };
            if (createdAt !== undefined) row.createdAt = createdAt;
            if (world.hashes.has(key)) row.passwordHash = world.hashes.get(key);
            return row;
          }),
          updateOne: jest.fn(async (filter: Doc) => {
            world.passwordUsage.push(`${filter.pageType}:${filter.pageId}`);
            return { matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      if (name === 'projects') {
        return {
          findOne: jest.fn(async (q: Doc) =>
            q._id
              ? world.projects.find((p) => sameId(p._id, q._id)) ?? null
              : q.editSlug
                ? world.projects.find((p) => p.editSlug === q.editSlug) ?? null
                : null
          ),
          updateOne: jest.fn(async (filter: Doc, update: Doc) => {
            world.projectUpdates.push({ filter, update });
            return { matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      if (name === 'partners') {
        return {
          findOne: jest.fn(async (q: Doc) => {
            if (q._id) return world.partners.find((p) => sameId(p._id, q._id)) ?? null;
            if (q.viewSlug) return world.partners.find((p) => p.viewSlug === q.viewSlug) ?? null;
            if (q.legacyViewSlugs) {
              return world.partners.find((p) => (p.legacyViewSlugs ?? []).includes(q.legacyViewSlugs)) ?? null;
            }
            return null;
          }),
          updateOne: jest.fn(async (filter: Doc, update: Doc) => {
            // The late-write guard: editorSeq.<tab> must be absent or lower.
            const target = world.partners.find((p) => sameId(p._id, filter._id));
            for (const [path, condition] of Object.entries(filter)) {
              if (!path.startsWith('editorSeq.')) continue;
              const stored = target?.editorSeq?.[path.slice('editorSeq.'.length)];
              if (typeof stored === 'number' && stored >= (condition as Doc).$not.$gte) return { matchedCount: 0, modifiedCount: 0 };
            }
            world.partnerUpdates.push({ filter, update });
            if (target) {
              for (const [path, value] of Object.entries(update.$set || {})) {
                if (path.startsWith('editorSeq.')) {
                  target.editorSeq = { ...(target.editorSeq || {}), [path.slice('editorSeq.'.length)]: value };
                }
              }
            }
            return { matchedCount: 1, modifiedCount: 1 };
          }),
        };
      }
      // The real updateReportVariant, where a test runs it: $set and $unset
      // applied to world.variants.
      if (name === 'report_variants') {
        return {
          findOne: jest.fn(async (q: Doc) => world.variants.find((v) => sameId(v._id, q._id)) ?? null),
          updateOne: jest.fn(async (filter: Doc, update: Doc) => {
            const target = world.variants.find((v) => sameId(v._id, filter._id));
            if (!target) return { matchedCount: 0, modifiedCount: 0 };
            // The late-write guard: editorSeq.<tab> must be absent or lower.
            for (const [path, condition] of Object.entries(filter)) {
              if (!path.startsWith('editorSeq.')) continue;
              const stored = target.editorSeq?.[path.slice('editorSeq.'.length)];
              if (typeof stored === 'number' && stored >= (condition as Doc).$not.$gte) return { matchedCount: 0, modifiedCount: 0 };
            }
            world.variantUpdates.push({ id: String(filter._id), update });
            // Dotted paths address nested fields, as in MongoDB.
            for (const [path, value] of Object.entries(update.$set || {})) {
              const keys = path.split('.');
              let node = target;
              for (const key of keys.slice(0, -1)) node = node[key] = node[key] && typeof node[key] === 'object' ? node[key] : {};
              node[keys[keys.length - 1]] = value;
            }
            for (const path of Object.keys(update.$unset || {})) {
              const keys = path.split('.');
              let node: Doc | undefined = target;
              for (const key of keys.slice(0, -1)) node = node?.[key];
              if (node) delete node[keys[keys.length - 1]];
            }
            return { matchedCount: 1, modifiedCount: 1 };
          }),
          updateMany: jest.fn(async () => ({ matchedCount: 0, modifiedCount: 0 })),
        };
      }
      // A successful PUT /api/projects touches these: hashtag counts (none
      // change in these tests) and the style lookup (every style exists).
      if (name === 'hashtags' || name === 'report_styles') {
        return {
          findOne: jest.fn(async () => ({ _id: 'exists' })),
          updateOne: jest.fn(async () => ({ matchedCount: 1, modifiedCount: 1 })),
          deleteMany: jest.fn(async () => ({ deletedCount: 0 })),
          countDocuments: jest.fn(async () => 1),
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    },
    admin: () => ({ ping: jest.fn(async () => ({ ok: 1 })) }),
  };
}

function setup(overrides: Partial<Pick<World, 'admin' | 'role' | 'projects' | 'partners' | 'variants'>> & { protectedPages?: string[] } = {}) {
  const world: World = {
    admin: overrides.admin ?? false,
    role: overrides.role ?? 'admin',
    jar: new Map(),
    passwords: new Map(
      (overrides.protectedPages ?? []).map((key) => [key, new Date(PASSWORD_SET_AT).toISOString()])
    ),
    hashes: new Map(),
    passwordUsage: [],
    projects: overrides.projects ?? [],
    partners: overrides.partners ?? [],
    variants: overrides.variants ?? [{ _id: 'variant-1', slug: 'vip', statsOverrides: { reportText1: 'kept' } }],
    partnerUpdates: [],
    projectUpdates: [],
    variantUpdates: [],
  };
  const db = buildDb(world);

  jest.doMock('next/headers', () => ({
    __esModule: true,
    cookies: jest.fn(async () => ({
      get: (name: string) => (world.jar.has(name) ? { name, value: world.jar.get(name) } : undefined),
    })),
  }));
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => (world.admin ? { id: 'u1', role: world.role } : null)),
  }));
  jest.doMock('@/lib/fanmassIntegration', () => ({
    __esModule: true,
    getDb: jest.fn(async () => db),
  }));
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({ db: jest.fn(() => db) }),
  }));
  jest.doMock('@/lib/config', () => ({
    __esModule: true,
    default: { dbName: 'messmass-test' },
  }));
  jest.doMock('@/lib/slugUtils', () => ({
    __esModule: true,
    // Mirrors the real lookup: an ObjectId-shaped slug is looked up as _id.
    findProjectByEditSlug: jest.fn(async (slug: string) =>
      ObjectId.isValid(slug) && slug.length === 24
        ? world.projects.find((p) => sameId(p._id, slug)) ?? null
        : world.projects.find((p) => p.editSlug === slug) ?? null
    ),
    generateProjectSlugs: jest.fn(),
  }));
  jest.doMock('@/lib/reportVariants', () => ({
    __esModule: true,
    listReportVariants: jest.fn(async () => ({ variants: world.variants })),
    resolveReportVariant: jest.fn(async () => ({ variant: world.variants[0] ?? { _id: 'variant-1', slug: 'vip', statsOverrides: {} } })),
    updateReportVariant: jest.fn(async (_db: unknown, id: string, update: Doc) => {
      world.variantUpdates.push({ id, update });
      return { ...(world.variants.find((v) => v._id === id) ?? {}), ...update };
    }),
  }));
  jest.doMock('@/lib/v3/syncEngine', () => ({
    __esModule: true,
    syncPartnerToV3Entity: jest.fn(async () => undefined),
  }));
  jest.doMock('@/lib/notificationUtils', () => ({
    __esModule: true,
    createNotification: jest.fn(async () => undefined),
    getCurrentActor: jest.fn(async () => ({ name: 'test' })),
  }));
  jest.doMock('@/lib/bitly-recalculator', () => ({
    __esModule: true,
    recalculateProjectLinks: jest.fn(async () => undefined),
    handleProjectDeletion: jest.fn(async () => undefined),
    createLinkAssociation: jest.fn(async () => undefined),
  }));

  // Carry a response's Set-Cookie into the jar, as the browser would.
  const adopt = (res: NextResponse): string | undefined => {
    const value = res.cookies.get('page-access')?.value;
    if (value) world.jar.set('page-access', value);
    return value;
  };

  return { world, db, adopt };
}

function editGet(slug: string) {
  return new NextRequest(`http://localhost/api/projects/edit/${slug}`);
}

function partnerEditGet(slug: string, variant?: string) {
  const query = variant ? `?variant=${encodeURIComponent(variant)}` : '';
  return new NextRequest(`http://localhost/api/partners/edit/${slug}${query}`);
}

function project(overrides: Doc = {}): Doc {
  return { _id: new ObjectId(), eventName: 'Test Event', editSlug: EDIT_SLUG, stats: { female: 1 }, ...overrides };
}

function partner(overrides: Doc = {}): Doc {
  return { _id: new ObjectId(), name: 'Test Partner', emoji: 'x', viewSlug: PARTNER_SLUG, stats: {}, ...overrides };
}

let nowMs = START;

beforeEach(() => {
  nowMs = START;
  jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
});

describe('event editor: saving follows loading', () => {
  it('an unprotected editor opened by its edit link issues the grant PUT /api/projects needs', async () => {
    const p = project();
    const { db, adopt } = setup({ projects: [p] });
    const { requireProjectWrite, requireEditorAccess } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    // The incident: before the editor loads, the operator has no way to save.
    const before = await requireProjectWrite(db, String(p._id));
    expect(before?.status).toBe(401);
    expect((await before!.json()).code).toBe('EDIT_ACCESS_REQUIRED');

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect(adopt(res)).toBeTruthy();
    expect(res.cookies.get('page-access')).toMatchObject({ httpOnly: true, path: '/', sameSite: 'lax' });
    const body = await res.json();
    expect(body.canSave).toBe(true);
    expect(body.project.editSlug).toBe(EDIT_SLUG);

    expect(await requireProjectWrite(db, String(p._id))).toBeNull();
    // Hashtag and chart-block writes from the same editor pass too.
    expect(await requireEditorAccess()).toBeNull();
  });

  it('the grant is scoped to that one event', async () => {
    const a = project();
    const b = project({ editSlug: OTHER_EDIT_SLUG });
    const { db, adopt } = setup({ projects: [a, b] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));

    expect(await requireProjectWrite(db, String(a._id))).toBeNull();
    expect((await requireProjectWrite(db, String(b._id)))?.status).toBe(401);
  });

  it('a protected editor without a grant answers 401 PAGE_PASSWORD_REQUIRED and issues nothing', async () => {
    const p = project();
    const { db } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requireProjectWrite(db, String(p._id)))?.status).toBe(401);
  });

  it('a protected editor with a valid grant renews it, so an open editor keeps saving past 12 hours', async () => {
    const p = project();
    const { world, db, adopt } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    // Password entered at START.
    const fromPassword = mintPageAccessToken(undefined, 'edit', EDIT_SLUG);
    world.jar.set('page-access', fromPassword);

    // 11 hours in, the tab regains focus and re-fetches the editor.
    nowMs = START + 11 * HOUR_MS;
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    const renewed = adopt(res);
    expect(renewed).toBeTruthy();
    expect(renewed).not.toBe(fromPassword);

    // 22 hours after the password: the renewed grant still saves...
    nowMs = START + 22 * HOUR_MS;
    expect(await requireProjectWrite(db, String(p._id))).toBeNull();

    // ...while the original, unrenewed grant would not have.
    world.jar.set('page-access', fromPassword);
    expect((await requireProjectWrite(db, String(p._id)))?.status).toBe(401);
  });

  it('an expired grant on a protected editor is not renewed', async () => {
    const p = project();
    const { world } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));
    nowMs = START + 13 * HOUR_MS;

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
  });

  it('renewing one page does not extend a grant for another', async () => {
    const protectedEvent = project();
    const openEvent = project({ editSlug: OTHER_EDIT_SLUG });
    const { world, db, adopt } = setup({
      projects: [protectedEvent, openEvent],
      protectedPages: [`edit:${EDIT_SLUG}`],
    });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));

    nowMs = START + 11 * HOUR_MS;
    adopt(await GET(editGet(OTHER_EDIT_SLUG), { params: Promise.resolve({ slug: OTHER_EDIT_SLUG }) }));

    nowMs = START + 13 * HOUR_MS;
    expect((await requireProjectWrite(db, String(protectedEvent._id)))?.status).toBe(401);
    expect(await requireProjectWrite(db, String(openEvent._id))).toBeNull();
  });

  it('an admin session is not converted into a grant', async () => {
    const p = project();
    const { world } = setup({ admin: true, projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect(world.jar.size).toBe(0);
  });

  it('a password stored on the _id protects the editor opened by its edit slug: no load, no grant', async () => {
    // Edit shares were keyed `editSlug || _id`, so an older password can sit
    // on the _id. The edit-slug address must not count as unprotected.
    const p = project();
    const id = String(p._id);
    const { world, db } = setup({ projects: [p], protectedPages: [`edit:${id}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect(world.jar.size).toBe(0);
    expect((await requireProjectWrite(db, id))?.status).toBe(401);
  });

  it('a password stored on the _id is still prompted for at the _id address', async () => {
    const p = project();
    const id = String(p._id);
    setup({ projects: [p], protectedPages: [`edit:${id}`] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
  });

  it('a current grant for the _id alias earns the edit:<editSlug> grant, so the editor can save', async () => {
    // A password row keyed by the _id (edit shares were keyed `editSlug ||
    // _id`) admits a grant for edit:<_id>, but requireProjectWrite checks
    // edit:<editSlug> only. The loader issues that grant too: the _id grant
    // is newer than the password, so its holder entered the password.
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p], protectedPages: [`edit:${id}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', id));
    expect((await requireProjectWrite(db, id))?.status).toBe(401);

    for (const slug of [id, EDIT_SLUG]) {
      const res = await GET(editGet(slug), { params: Promise.resolve({ slug }) });
      expect(res.status).toBe(200);
      expect(adopt(res)).toBeTruthy();
      expect((await res.json()).canSave).toBe(true);
      expect(await requireProjectWrite(db, id)).toBeNull();
    }
  });

  it('an _id grant older than the password earns nothing', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db } = setup({ projects: [p] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', id));
    nowMs = START + HOUR_MS;
    setPassword(world, `edit:${id}`);

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requireProjectWrite(db, id))?.status).toBe(401);
  });
});

describe('F-009: a project id alone still writes nothing', () => {
  it('anonymous PUT /api/projects with only a projectId => 401 EDIT_ACCESS_REQUIRED, no write', async () => {
    const p = project();
    const { world } = setup({ projects: [p] });
    const { PUT } = await import('@/app/api/projects/route');

    const res = await PUT(
      new NextRequest('http://localhost/api/projects', {
        method: 'PUT',
        body: JSON.stringify({ projectId: String(p._id), stats: { female: 999 } }),
      })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.projectUpdates).toEqual([]);
  });

  it('the public _id does not open the editor, disclose the edit slug, or issue a grant', async () => {
    const p = project();
    const { db } = setup({ projects: [p] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const id = String(p._id);
    const res = await GET(editGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('EDIT_LINK_REQUIRED');
    expect(JSON.stringify(body)).not.toContain(EDIT_SLUG);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requireProjectWrite(db, id))?.status).toBe(401);
  });

  it('the _id no longer reads around a protected editor password', async () => {
    const p = project();
    setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const id = String(p._id);
    const res = await GET(editGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain('"stats"');
  });

  it('a signed-in user can still open the editor by _id, without a grant being issued', async () => {
    const p = project();
    setup({ admin: true, projects: [p] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const id = String(p._id);
    const res = await GET(editGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    expect(res.cookies.get('page-access')).toBeUndefined();
  });

  it('a legacy edit slug that equals the public _id loads as before, issues no grant, and reports canSave false', async () => {
    const _id = new ObjectId();
    const p = project({ _id, editSlug: String(_id) });
    const { db } = setup({ projects: [p] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(String(_id)), { params: Promise.resolve({ slug: String(_id) }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(false);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requireProjectWrite(db, String(_id)))?.status).toBe(401);
  });

  it('the same legacy edit slug reports canSave true for a signed-in user', async () => {
    const _id = new ObjectId();
    const p = project({ _id, editSlug: String(_id) });
    setup({ admin: true, projects: [p] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    const res = await GET(editGet(String(_id)), { params: Promise.resolve({ slug: String(_id) }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    expect(res.cookies.get('page-access')).toBeUndefined();
  });
});

describe('partner editor: no grant from a public slug; canSave says so', () => {
  function putPartner(body: Doc) {
    return new NextRequest('http://localhost/api/partners', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('an unprotected partner editor opened by its slug loads with canSave false and issues no grant', async () => {
    // The partner edit slug is the public report slug (/partner-report/<viewSlug>),
    // so holding it must not become write access.
    const pt = partner();
    const { world, db, adopt } = setup({ partners: [pt] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');
    const { PUT } = await import('@/app/api/partners/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect(adopt(res)).toBeUndefined();
    const body = await res.json();
    expect(body.canSave).toBe(false);
    expect(body.partner.viewSlug).toBe(PARTNER_SLUG);
    expect(world.jar.size).toBe(0);

    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
    const put = await PUT(putPartner({ partnerId: String(pt._id), stats: { reportText1: 'x' } }));
    expect(put.status).toBe(401);
    expect((await put.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.partnerUpdates).toEqual([]);
  });

  it('the raw partner _id opens the editor as before but issues no grant', async () => {
    const pt = partner();
    const { db } = setup({ partners: [pt] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const id = String(pt._id);
    const res = await GET(partnerEditGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(false);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requirePartnerWrite(db, id))?.status).toBe(401);
  });

  it('a legacy human-readable slug opens the editor as before but issues no grant', async () => {
    const pt = partner({ legacyViewSlugs: ['legacy-partner-slug'] });
    const { db } = setup({ partners: [pt] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet('legacy-partner-slug'), { params: Promise.resolve({ slug: 'legacy-partner-slug' }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(false);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
  });

  it('a signed-in user on an unprotected partner editor gets canSave true and no grant', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, partners: [pt] });
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect(world.jar.size).toBe(0);
  });

  it('an anonymous custom variant load on an unprotected partner reports canSave false', async () => {
    // The variant link /partner-report/<viewSlug>?variant=vip is public too.
    const pt = partner();
    setup({ partners: [pt] });
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(false);
    expect(res.cookies.get('page-access')).toBeUndefined();
  });

  it('a protected partner editor without a grant answers 401 PAGE_PASSWORD_REQUIRED and issues nothing', async () => {
    const pt = partner();
    const { db } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
  });

  it('a protected partner editor with a valid grant renews it and reports canSave true', async () => {
    const pt = partner();
    const { world, db, adopt } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { requirePartnerWrite, requirePartnerWriteAccess } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const fromPassword = mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG);
    world.jar.set('page-access', fromPassword);

    nowMs = START + 11 * HOUR_MS;
    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    const renewed = adopt(res);
    expect(renewed).toBeTruthy();
    expect(renewed).not.toBe(fromPassword);

    nowMs = START + 22 * HOUR_MS;
    expect(await requirePartnerWrite(db, String(pt._id))).toBeNull();
    expect(await requirePartnerWriteAccess(db, String(pt._id))).toEqual({ allowed: true, via: 'page-grant', isAdmin: false });

    // The unrenewed password grant would have lapsed by now.
    world.jar.set('page-access', fromPassword);
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
  });

  it('an expired grant on a protected partner editor is not renewed', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG));
    nowMs = START + 13 * HOUR_MS;

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
  });

  it('a password on the _id alias still protects the UUID slug, and nothing is issued', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${String(pt._id)}`] });
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect(world.jar.size).toBe(0);
  });
});

describe('PUT /api/partners/edit/[slug]?variant=: the public report slug writes nothing', () => {
  function variantPut(slug: string, variant: string | null, body: Doc) {
    const query = variant ? `?variant=${encodeURIComponent(variant)}` : '';
    return new NextRequest(`http://localhost/api/partners/edit/${slug}${query}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
  const wipe = { metadata: { stats: {}, logoUrl: 'https://example.com/other.png' } };

  it('an anonymous variant save on an unprotected partner => 401 EDIT_ACCESS_REQUIRED, nothing written', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await PUT(variantPut(PARTNER_SLUG, 'vip', wipe), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.variantUpdates).toEqual([]);
  });

  it('the raw partner _id does not open a variant for writing either', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const id = String(pt._id);
    const res = await PUT(variantPut(id, 'vip', wipe), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(401);
    expect(world.variantUpdates).toEqual([]);
  });

  it('a signed-in user still saves a custom variant', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, partners: [pt] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await PUT(
      variantPut(PARTNER_SLUG, 'vip', { metadata: { stats: { reportText1: 'new' } } }),
      { params: Promise.resolve({ slug: PARTNER_SLUG }) }
    );
    expect(res.status).toBe(200);
    expect(world.variantUpdates).toHaveLength(1);
    expect(world.variantUpdates[0].update.statsOverrides).toEqual({ reportText1: 'new' });
  });

  it('a signed-in user loads a custom variant with canSave true, protected or not, and no grant is issued', async () => {
    for (const protectedPages of [[], [`partner-edit:${PARTNER_SLUG}`], [`partner-edit:${PARTNER_SLUG}::variant=vip`]]) {
      const pt = partner();
      const { world } = setup({ admin: true, partners: [pt], protectedPages });
      const { GET } = await import('@/app/api/partners/edit/[slug]/route');

      const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
      expect(res.status).toBe(200);
      expect((await res.json()).canSave).toBe(true);
      expect(res.cookies.get('page-access')).toBeUndefined();
      expect(world.jar.size).toBe(0);
      jest.resetModules();
    }
  });

  it('a variant load returns the variant\'s own showOnlyTeam1Events, not the partner\'s', async () => {
    const pt = partner({ showOnlyTeam1Events: true });
    setup({ admin: true, partners: [pt], variants: [{ _id: 'variant-1', slug: 'vip', statsOverrides: {}, showOnlyTeam1Events: false }] });
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).partner.showOnlyTeam1Events).toBe(false);
  });

  it('a signed-in user saves a custom variant of a protected partner without a grant', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const id = String(pt._id);
    const res = await PUT(variantPut(id, 'vip', { metadata: { stats: { reportText1: 'new' } } }), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(200);
    expect(world.variantUpdates).toHaveLength(1);
  });

  it('an anonymous variant save on a protected partner is refused at the gate, nothing written', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const id = String(pt._id);
    const res = await PUT(variantPut(id, 'vip', wipe), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(world.variantUpdates).toEqual([]);
  });

  it('a variant password holder loads with canSave true and saves the variant by _id, as the editor does', async () => {
    // PartnerEditClient unlocks a variant under `<canonical slug>::variant=<v>`
    // (the viewSlug, or the _id for a partner without one), and
    // PartnerEditorDashboard then PUTs /api/partners/edit/<_id>?variant=<v>.
    const cases: Array<{ viewSlug?: string }> = [{ viewSlug: PARTNER_SLUG }, { viewSlug: undefined }];
    for (const { viewSlug } of cases) {
      const pt = partner({ viewSlug });
      const id = String(pt._id);
      const openedAs = viewSlug ?? id;
      const variantKey = `${openedAs}::variant=vip`;
      const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${variantKey}`] });
      const { mintPageAccessToken } = await import('@/lib/pageAccess');
      const { GET, PUT } = await import('@/app/api/partners/edit/[slug]/route');

      // As PUT /api/page-passwords issues it after the variant password.
      world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', variantKey));

      const res = await GET(partnerEditGet(openedAs, 'vip'), { params: Promise.resolve({ slug: openedAs }) });
      expect(res.status).toBe(200);
      expect((await res.json()).canSave).toBe(true);

      const put = await PUT(
        variantPut(id, 'vip', { metadata: { stats: { reportText1: 'new' } } }),
        { params: Promise.resolve({ slug: id }) }
      );
      expect(put.status).toBe(200);
      expect(world.variantUpdates).toHaveLength(1);
      expect(world.variantUpdates[0].update.statsOverrides).toEqual({ reportText1: 'new' });
      jest.resetModules();
    }
  });

  it('a partner-edit password holder for the base page loads and saves its custom variants', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET, PUT } = await import('@/app/api/partners/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG));

    const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);

    const id = String(pt._id);
    const put = await PUT(variantPut(id, 'vip', { metadata: { stats: { reportText1: 'new' } } }), { params: Promise.resolve({ slug: id }) });
    expect(put.status).toBe(200);
    expect(world.variantUpdates).toHaveLength(1);
  });

  it('a variant grant writes that variant only: not another variant, not the default report', async () => {
    const pt = partner();
    const variantKey = `${PARTNER_SLUG}::variant=vip`;
    const { world } = setup({
      partners: [pt],
      protectedPages: [`partner-edit:${variantKey}`],
      variants: [
        { _id: 'variant-1', slug: 'vip', statsOverrides: { reportText1: 'kept' } },
        { _id: 'variant-2', slug: 'press', statsOverrides: { reportText1: 'kept' } },
      ],
    });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET, PUT } = await import('@/app/api/partners/edit/[slug]/route');
    const partnersRoute = await import('@/app/api/partners/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', variantKey));
    const id = String(pt._id);

    // Another variant of the same partner, which has no password of its own.
    const other = await GET(partnerEditGet(PARTNER_SLUG, 'press'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(other.status).toBe(200);
    expect((await other.json()).canSave).toBe(false);
    const otherPut = await PUT(variantPut(id, 'press', wipe), { params: Promise.resolve({ slug: id }) });
    expect(otherPut.status).toBe(401);
    expect((await otherPut.json()).code).toBe('EDIT_ACCESS_REQUIRED');

    // The default report, which saves through PUT /api/partners.
    const base = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(base.status).toBe(200);
    expect((await base.json()).canSave).toBe(false);
    const basePut = await partnersRoute.PUT(
      new NextRequest('http://localhost/api/partners', {
        method: 'PUT',
        body: JSON.stringify({ partnerId: id, stats: { reportText1: 'x' } }),
      })
    );
    expect(basePut.status).toBe(401);

    expect(world.variantUpdates).toEqual([]);
    expect(world.partnerUpdates).toEqual([]);
  });

  it("another partner's grants write nothing here", async () => {
    const target = partner();
    const own = partner({ viewSlug: '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d' });
    const { world } = setup({ partners: [target, own] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET, PUT } = await import('@/app/api/partners/edit/[slug]/route');

    // Everything a password holder for `own` could carry.
    let token = mintPageAccessToken(undefined, 'partner-edit', own.viewSlug);
    token = mintPageAccessToken(token, 'partner-edit', `${own.viewSlug}::variant=vip`);
    token = mintPageAccessToken(token, 'partner-edit', String(own._id));
    world.jar.set('page-access', token);

    const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect((await res.json()).canSave).toBe(false);

    const id = String(target._id);
    const put = await PUT(variantPut(id, 'vip', wipe), { params: Promise.resolve({ slug: id }) });
    expect(put.status).toBe(401);
    expect((await put.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.variantUpdates).toEqual([]);
  });

  it('a regenerated variant password refuses the old variant grant on load and on save', async () => {
    const pt = partner();
    const variantKey = `${PARTNER_SLUG}::variant=vip`;
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${variantKey}`] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET, PUT } = await import('@/app/api/partners/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', variantKey));

    nowMs = START + HOUR_MS;
    setPassword(world, `partner-edit:${variantKey}`);

    nowMs = START + 2 * HOUR_MS;
    const res = await GET(partnerEditGet(PARTNER_SLUG, 'vip'), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();

    const id = String(pt._id);
    const put = await PUT(variantPut(id, 'vip', wipe), { params: Promise.resolve({ slug: id }) });
    expect(put.status).toBe(401);
    expect(world.variantUpdates).toEqual([]);
  });
});

describe('a new or regenerated password cuts off earlier grants', () => {
  function putProject(body: Doc) {
    return new NextRequest('http://localhost/api/projects', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('a password set on an open editor refuses the link-issued grant: no renewal, no save', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p] });
    const { requireProjectWrite, requireProjectWriteAccess } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');
    const { PUT } = await import('@/app/api/projects/route');

    // The link leaks, or an operator is being removed: they hold a grant.
    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));
    expect(await requireProjectWriteAccess(db, id)).toEqual({ allowed: true, via: 'page-grant', isAdmin: false });

    // An admin sets an edit password to lock them out.
    nowMs = START + HOUR_MS;
    setPassword(world, `edit:${EDIT_SLUG}`);

    // Every reload before the old 12 hours end is refused and renews nothing.
    for (const hours of [2, 11]) {
      nowMs = START + hours * HOUR_MS;
      const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
      expect(res.status).toBe(401);
      expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
      expect(res.cookies.get('page-access')).toBeUndefined();
      expect((await requireProjectWrite(db, id))?.status).toBe(401);
    }

    const put = await PUT(putProject({ projectId: id, eventName: 'x', stats: { female: 999 } }));
    expect(put.status).toBe(401);
    expect((await put.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.projectUpdates).toEqual([]);
  });

  it('a password set on the _id alias cuts off the edit-slug grant too', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));
    nowMs = START + HOUR_MS;
    setPassword(world, `edit:${id}`);

    expect((await requireProjectWrite(db, id))?.status).toBe(401);
  });

  it('a regenerated edit password refuses the old password grant, and the new password works', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));
    nowMs = START + HOUR_MS;
    expect(await requireProjectWrite(db, id)).toBeNull();

    // The guest password leaked; an admin regenerates it.
    nowMs = START + 2 * HOUR_MS;
    setPassword(world, `edit:${EDIT_SLUG}`);

    nowMs = START + 3 * HOUR_MS;
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requireProjectWrite(db, id))?.status).toBe(401);

    // Entering the new password (PUT /api/page-passwords) issues a newer grant.
    world.jar.set('page-access', mintPageAccessToken(world.jar.get('page-access'), 'edit', EDIT_SLUG));
    const again = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(again.status).toBe(200);
    expect((await again.json()).canSave).toBe(true);
    adopt(again);
    expect(await requireProjectWrite(db, id)).toBeNull();
  });

  it('a regenerated partner-edit password refuses the old grant on load and on save', async () => {
    const pt = partner();
    const { world, db } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');
    const { PUT } = await import('@/app/api/partners/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG));
    nowMs = START + HOUR_MS;
    expect(await requirePartnerWrite(db, String(pt._id))).toBeNull();

    nowMs = START + 2 * HOUR_MS;
    setPassword(world, `partner-edit:${PARTNER_SLUG}`);

    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);

    const put = await PUT(
      new NextRequest('http://localhost/api/partners', {
        method: 'PUT',
        body: JSON.stringify({ partnerId: String(pt._id), stats: { reportText1: 'x' } }),
      })
    );
    expect(put.status).toBe(401);
    expect(world.partnerUpdates).toEqual([]);
  });

  it('a partner-edit password on a legacy slug cuts off grants for the viewSlug', async () => {
    const pt = partner({ legacyViewSlugs: ['legacy-partner-slug'] });
    const { world, db } = setup({ partners: [pt] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG));
    expect(await requirePartnerWrite(db, String(pt._id))).toBeNull();

    nowMs = START + HOUR_MS;
    setPassword(world, 'partner-edit:legacy-partner-slug');
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
  });

  it('a legacy password row with no createdAt still honours a grant (no lockout)', async () => {
    // Refusing every grant there would lock the editor for good: a grant from
    // re-entering the password could not be shown to be newer either.
    const p = project();
    const { world, db } = setup({ projects: [p] });
    world.passwords.set(`edit:${EDIT_SLUG}`, undefined);
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect(await requireProjectWrite(db, String(p._id))).toBeNull();
  });

  it('a grant issued in the same second the password was set is accepted', async () => {
    const p = project();
    const { world, db } = setup({ projects: [p] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');

    setPassword(world, `edit:${EDIT_SLUG}`, START + 500);
    nowMs = START + 900;
    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));
    expect(await requireProjectWrite(db, String(p._id))).toBeNull();
  });
});

describe('PUT /api/projects: what an event edit grant may change', () => {
  it('a grant holder is reported as page-grant, and the editor fields exclude name, date, partner, template and style', async () => {
    const p = project();
    const { db, adopt } = setup({ projects: [p] });
    const { requireProjectWriteAccess, pickWritableFields, EVENT_EDITOR_WRITABLE_FIELDS } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));
    expect(await requireProjectWriteAccess(db, String(p._id))).toEqual({ allowed: true, via: 'page-grant', isAdmin: false });

    const editorSave = {
      hashtags: ['a'],
      categorizedHashtags: { country: ['hu'] },
      stats: { female: 2 },
      statsChanges: { female: 3 },
    };
    const picked = pickWritableFields(
      {
        projectId: String(p._id),
        ...editorSave,
        eventName: 'Renamed by the link',
        eventDate: '2020-01-01',
        partner1Id: String(new ObjectId()),
        partner2Id: String(new ObjectId()),
        reportTemplateId: String(new ObjectId()),
        styleId: String(new ObjectId()),
      },
      EVENT_EDITOR_WRITABLE_FIELDS
    );
    expect(picked).toEqual(editorSave);
  });

  it('a signed-in user is reported as session', async () => {
    const p = project();
    const { db } = setup({ admin: true, projects: [p] });
    const { requireProjectWriteAccess } = await import('@/lib/apiGuards');

    expect(await requireProjectWriteAccess(db, String(p._id))).toEqual({ allowed: true, via: 'session', isAdmin: true });
  });

  function putProject(body: Doc) {
    return new NextRequest('http://localhost/api/projects', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('the route stores what a grant holder saves and ignores name, date, partner, template and style', async () => {
    // The link-issued grant must not rename or re-date the event (a date
    // change re-runs the Bitly recalculation), re-point partner1Id/partner2Id
    // (which changes what another partner's report aggregates) or change the
    // style/template.
    const p = project();
    const { world, adopt } = setup({ projects: [p] });
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');
    const { PUT } = await import('@/app/api/projects/route');

    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));
    const res = await PUT(
      putProject({
        projectId: String(p._id),
        eventName: 'Renamed by the link',
        eventDate: '2020-01-01',
        stats: { female: 2 },
        partner1Id: String(new ObjectId()),
        partner2Id: null,
        reportTemplateId: null,
        styleId: String(new ObjectId()),
      })
    );

    expect(res.status).toBe(200);
    expect(world.projectUpdates).toHaveLength(1);
    const { update } = world.projectUpdates[0];
    expect(update.$set.stats.female).toBe(2);
    expect(update.$set).not.toHaveProperty('eventName');
    expect(update.$set).not.toHaveProperty('eventDate');
    expect(update.$set).not.toHaveProperty('partner1Id');
    expect(update.$set).not.toHaveProperty('partner2Id');
    expect(update.$set).not.toHaveProperty('reportTemplateId');
    expect(update.$set).not.toHaveProperty('styleIdEnhanced');
    expect(update.$unset).toBeUndefined();
  });

  it('the route still lets a signed-in user change partner, template and style', async () => {
    const p = project();
    const { world } = setup({ admin: true, projects: [p] });
    const { PUT } = await import('@/app/api/projects/route');
    const partner1Id = String(new ObjectId());
    const styleId = String(new ObjectId());

    const res = await PUT(
      putProject({
        projectId: String(p._id),
        eventName: 'Test Event',
        eventDate: '2026-09-27',
        stats: { female: 2 },
        partner1Id,
        partner2Id: null,
        styleId,
      })
    );

    expect(res.status).toBe(200);
    const { update } = world.projectUpdates[0];
    expect(String(update.$set.partner1Id)).toBe(partner1Id);
    expect(update.$set.styleIdEnhanced).toBe(styleId);
    expect(update.$unset).toEqual({ partner2Id: '' });
  });

  it('every field the event editor saves is writable by a grant holder', async () => {
    // A field the editor sends but the list omits would be dropped silently
    // for every operator without a session -- the incident's failure mode.
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(path.join(process.cwd(), 'components/EditorDashboard.tsx'), 'utf8');
    const block = source.match(/interface EditorSavePayload\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    const sent = Array.from(block![1].matchAll(/^\s*(\w+)\??:/gm), (m) => m[1]).filter((f) => f !== 'projectId');
    expect(sent.length).toBeGreaterThan(0);
    const { EVENT_EDITOR_WRITABLE_FIELDS } = await import('@/lib/apiGuards');
    expect(sent.filter((f) => !(EVENT_EDITOR_WRITABLE_FIELDS as readonly string[]).includes(f))).toEqual([]);
  });
});

describe('PUT /api/partners: what a partner-edit grant may change', () => {
  const fullBody = (partnerId: string) => ({
    partnerId,
    name: 'Renamed',
    hashtags: ['x'],
    googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/other',
    clickerSetId: String(new ObjectId()),
    bitlyLinkIds: [String(new ObjectId())],
    stats: { reportText1: 'hello' },
    logoUrl: 'https://example.com/logo.png',
    showEventsList: false,
  });

  function put(body: Doc) {
    return new NextRequest('http://localhost/api/partners', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('anonymous caller with only a partnerId => 401 EDIT_ACCESS_REQUIRED, no write', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt] });
    const { PUT } = await import('@/app/api/partners/route');

    const res = await PUT(put(fullBody(String(pt._id))));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('EDIT_ACCESS_REQUIRED');
    expect(world.partnerUpdates).toEqual([]);
  });

  it('a password grant holder writes the editor fields only; admin settings in the body are ignored', async () => {
    const pt = partner();
    const { world } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { PUT } = await import('@/app/api/partners/route');

    // As PUT /api/page-passwords issues it after a correct partner-edit password.
    world.jar.set('page-access', mintPageAccessToken(undefined, 'partner-edit', PARTNER_SLUG));

    const res = await PUT(put(fullBody(String(pt._id))));
    expect(res.status).toBe(200);
    expect(world.partnerUpdates).toHaveLength(1);
    const set = world.partnerUpdates[0].update.$set;
    expect(set).toMatchObject({
      stats: { reportText1: 'hello' },
      logoUrl: 'https://example.com/logo.png',
      showEventsList: false,
    });
    for (const adminField of ['name', 'hashtags', 'googleSheetsUrl', 'clickerSetId', 'bitlyLinkIds']) {
      expect(set).not.toHaveProperty(adminField);
    }
  });

  it('a signed-in user still writes every field', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, partners: [pt] });
    const { PUT } = await import('@/app/api/partners/route');

    const res = await PUT(put(fullBody(String(pt._id))));
    expect(res.status).toBe(200);
    const set = world.partnerUpdates[0].update.$set;
    expect(set).toMatchObject({ name: 'Renamed', hashtags: ['x'], googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/other' });
    expect(set).toHaveProperty('clickerSetId');
    expect(set).toHaveProperty('bitlyLinkIds');
  });
});

describe('grants from tokens signed before per-grant issue times', () => {
  // WHAT: A token from before per-grant times carries only its own iat, so its
  //     grants are dated by that. The iat moved each time the token was
  //     re-signed for any page, so it can post-date a password that was set to
  //     cut the grant off. On a protected page such a grant is never current:
  //     not renewed, not accepted for a save. Its holder enters the password
  //     once more. On an unprotected editor it still saves until it expires.
  const legacyToken = async (grants: string[]): Promise<string> => {
    const jwt = (await import('jsonwebtoken')).default;
    return jwt.sign({ grants }, process.env.JWT_SECRET || 'dev-secret-change-in-production', {
      algorithm: 'HS256',
      expiresIn: 12 * 60 * 60,
    });
  };

  it('a legacy grant on a protected editor is not renewed and does not save, even with an iat after the password', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    // Signed at START; the password was set a day earlier.
    world.jar.set('page-access', await legacyToken([`edit:${EDIT_SLUG}`]));

    expect((await requireProjectWrite(db, id))?.status).toBe(401);
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('PAGE_PASSWORD_REQUIRED');
    expect(res.cookies.get('page-access')).toBeUndefined();
  });

  it('entering the password once more issues a dated grant that loads, renews and saves', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p], protectedPages: [`edit:${EDIT_SLUG}`] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', await legacyToken([`edit:${EDIT_SLUG}`]));
    // As PUT /api/page-passwords does after the correct password.
    world.jar.set('page-access', mintPageAccessToken(world.jar.get('page-access'), 'edit', EDIT_SLUG));

    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    expect(adopt(res)).toBeTruthy();
    expect(await requireProjectWrite(db, id)).toBeNull();
  });

  it('re-signing the token for another page keeps a legacy grant undated', async () => {
    // Otherwise one visit to any other editor would write the fallback time
    // into the grant as its own, and the protected editor would accept it.
    const protectedEvent = project();
    const openEvent = project({ editSlug: OTHER_EDIT_SLUG });
    const { world, db, adopt } = setup({
      projects: [protectedEvent, openEvent],
      protectedPages: [`edit:${EDIT_SLUG}`],
    });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', await legacyToken([`edit:${EDIT_SLUG}`]));
    nowMs = START + HOUR_MS;
    expect(adopt(await GET(editGet(OTHER_EDIT_SLUG), { params: Promise.resolve({ slug: OTHER_EDIT_SLUG }) }))).toBeTruthy();

    expect(await requireProjectWrite(db, String(openEvent._id))).toBeNull();
    expect((await requireProjectWrite(db, String(protectedEvent._id)))?.status).toBe(401);
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(401);
  });

  it('on an unprotected editor a legacy grant still saves, and re-signing does not extend it', async () => {
    const p = project();
    const other = project({ editSlug: OTHER_EDIT_SLUG });
    const { world, db, adopt } = setup({ projects: [p, other] });
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    world.jar.set('page-access', await legacyToken([`edit:${EDIT_SLUG}`]));
    nowMs = START + 11 * HOUR_MS;
    expect(await requireProjectWrite(db, String(p._id))).toBeNull();
    adopt(await GET(editGet(OTHER_EDIT_SLUG), { params: Promise.resolve({ slug: OTHER_EDIT_SLUG }) }));

    // 12 hours after the legacy token was signed, its grant is gone.
    nowMs = START + 13 * HOUR_MS;
    expect((await requireProjectWrite(db, String(p._id)))?.status).toBe(401);
    expect(await requireProjectWrite(db, String(other._id))).toBeNull();
  });

  it('the read-only report gate still admits a legacy grant until it runs out', async () => {
    // It renews nothing and writes nothing, so refusing would only re-prompt
    // every report viewer once while the report page itself let them in.
    const p = project();
    const id = String(p._id);
    const { world } = setup({ projects: [p], protectedPages: [`event-report:${id}`] });
    const { requirePageAccess } = await import('@/lib/pageAccess');

    world.jar.set('page-access', await legacyToken([`event-report:${id}`]));
    expect(await requirePageAccess('event-report', id)).toBeNull();

    nowMs = START + 13 * HOUR_MS;
    expect((await requirePageAccess('event-report', id))?.status).toBe(401);
  });

  it('the same rule holds for partner-edit grants', async () => {
    const pt = partner();
    const { world, db } = setup({ partners: [pt], protectedPages: [`partner-edit:${PARTNER_SLUG}`] });
    const { requirePartnerWrite } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/partners/edit/[slug]/route');

    world.jar.set('page-access', await legacyToken([`partner-edit:${PARTNER_SLUG}`]));
    expect((await requirePartnerWrite(db, String(pt._id)))?.status).toBe(401);
    const res = await GET(partnerEditGet(PARTNER_SLUG), { params: Promise.resolve({ slug: PARTNER_SLUG }) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('page-access')).toBeUndefined();
  });
});

describe('an event edit password works at either address of the editor', () => {
  // Edit shares were keyed `editSlug || _id`, so the password can sit on
  // either; the editor can be opened at either. Low bcrypt cost: these rows
  // exist only for the test.
  const bcrypt = require('bcryptjs');
  const hash = (plain: string) => bcrypt.hashSync(plain, 4) as string;

  function withPassword(world: World, key: string, plain: string, atMs: number) {
    setPassword(world, key, atMs);
    world.hashes.set(key, hash(plain));
  }

  it('a password stored on the _id is accepted at the edit-slug address, and that editor saves', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p] });
    withPassword(world, `edit:${id}`, 'pw-on-id', PASSWORD_SET_AT);
    const { validatePagePassword } = await import('@/lib/pagePassword');
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    expect(await validatePagePassword(EDIT_SLUG, 'edit', 'pw-on-id')).toBe(true);
    expect(world.passwordUsage).toEqual([`edit:${id}`]);

    // PUT /api/page-passwords then grants the address it was entered on.
    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', EDIT_SLUG));
    const res = await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    adopt(res);
    expect(await requireProjectWrite(db, id)).toBeNull();
  });

  it('a password stored on the edit slug is accepted at the _id address, and that editor saves', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p] });
    withPassword(world, `edit:${EDIT_SLUG}`, 'pw-on-slug', PASSWORD_SET_AT);
    const { validatePagePassword } = await import('@/lib/pagePassword');
    const { requireProjectWrite } = await import('@/lib/apiGuards');
    const { mintPageAccessToken } = await import('@/lib/pageAccess');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');

    expect(await validatePagePassword(id, 'edit', 'pw-on-slug')).toBe(true);

    world.jar.set('page-access', mintPageAccessToken(undefined, 'edit', id));
    const res = await GET(editGet(id), { params: Promise.resolve({ slug: id }) });
    expect(res.status).toBe(200);
    expect((await res.json()).canSave).toBe(true);
    adopt(res);
    expect(await requireProjectWrite(db, id)).toBeNull();
  });

  it('a wrong password is refused at either address', async () => {
    const p = project();
    const id = String(p._id);
    const { world } = setup({ projects: [p] });
    withPassword(world, `edit:${id}`, 'pw-on-id', PASSWORD_SET_AT);
    const { validatePagePassword } = await import('@/lib/pagePassword');

    expect(await validatePagePassword(EDIT_SLUG, 'edit', 'guess')).toBe(false);
    expect(await validatePagePassword(id, 'edit', 'guess')).toBe(false);
    expect(world.passwordUsage).toEqual([]);
  });

  it('with a password on both addresses, only the newest one opens the editor', async () => {
    // Regenerating the edit password must retire an older one left on the
    // other address, or that one would stay a way in with no way to remove it.
    const p = project();
    const id = String(p._id);
    const { world } = setup({ projects: [p] });
    withPassword(world, `edit:${id}`, 'old-on-id', PASSWORD_SET_AT);
    withPassword(world, `edit:${EDIT_SLUG}`, 'new-on-slug', START - HOUR_MS);
    const { validatePagePassword } = await import('@/lib/pagePassword');

    for (const address of [id, EDIT_SLUG]) {
      expect(await validatePagePassword(address, 'edit', 'old-on-id')).toBe(false);
      expect(await validatePagePassword(address, 'edit', 'new-on-slug')).toBe(true);
    }
  });

  it('other page types still check only their own rows', async () => {
    const p = project();
    const id = String(p._id);
    const { world } = setup({ projects: [p] });
    withPassword(world, `event-report:${id}`, 'report-pw', PASSWORD_SET_AT);
    const { validatePagePassword } = await import('@/lib/pagePassword');

    expect(await validatePagePassword(id, 'event-report', 'report-pw')).toBe(true);
    expect(await validatePagePassword(EDIT_SLUG, 'event-report', 'report-pw')).toBe(false);
  });
});

describe('PUT /api/partners/edit/[slug]?variant=: removing the variant logo', () => {
  function variantPut(slug: string, variant: string, body: Doc) {
    return new NextRequest(`http://localhost/api/partners/edit/${slug}?variant=${encodeURIComponent(variant)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  it("an empty logoUrl reaches updateReportVariant as a removal; a missing one leaves it alone", async () => {
    const pt = partner({ logoUrl: 'https://example.com/partner.png' });
    const { world } = setup({ admin: true, partners: [pt] });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const removed = await PUT(variantPut(PARTNER_SLUG, 'vip', { metadata: { logoUrl: '' } }), {
      params: Promise.resolve({ slug: PARTNER_SLUG }),
    });
    expect(removed.status).toBe(200);
    expect(world.variantUpdates[0].update.logoUrl).toBeNull();
    expect((await removed.json()).partner.logoUrl).toBe('https://example.com/partner.png');

    await PUT(variantPut(PARTNER_SLUG, 'vip', { metadata: { emoji: 'y' } }), {
      params: Promise.resolve({ slug: PARTNER_SLUG }),
    });
    expect(world.variantUpdates[1].update.logoUrl).toBeUndefined();
  });

  it('the stored variant loses its own logo and falls back to the partner\'s', async () => {
    // The real updateReportVariant, so the $unset itself is what is checked.
    const pt = partner({ logoUrl: 'https://example.com/partner.png' });
    const variantId = new ObjectId();
    const { world } = setup({
      admin: true,
      partners: [pt],
      variants: [
        {
          _id: variantId,
          ownerType: 'partner',
          ownerId: String(pt._id),
          name: 'VIP',
          slug: 'vip',
          logoUrl: 'https://example.com/variant.png',
          emoji: 'v',
          statsOverrides: { reportText1: 'kept' },
        },
      ],
    });
    jest.doMock('@/lib/reportVariants', () => {
      const actual = jest.requireActual('@/lib/reportVariants');
      return {
        __esModule: true,
        ...actual,
        listReportVariants: jest.fn(async () => ({
          variants: world.variants.map((v) => ({ ...v, _id: String(v._id) })),
        })),
      };
    });
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');

    const res = await PUT(variantPut(PARTNER_SLUG, 'vip', { metadata: { logoUrl: '' } }), {
      params: Promise.resolve({ slug: PARTNER_SLUG }),
    });

    expect(res.status).toBe(200);
    expect(world.variantUpdates).toHaveLength(1);
    expect(world.variantUpdates[0].update.$unset).toEqual({ logoUrl: '' });
    expect(world.variantUpdates[0].update.$set).not.toHaveProperty('logoUrl');
    expect(world.variants[0]).not.toHaveProperty('logoUrl');
    expect(world.variants[0].emoji).toBe('v');
    expect(world.variants[0].statsOverrides).toEqual({ reportText1: 'kept' });
    const body = await res.json();
    expect(body.partner.logoUrl).toBe('https://example.com/partner.png');
    expect(body.partner.reportVariant.logoUrl).toBeUndefined();
  });

  it('updateReportVariant never sends one path to both $set and $unset', async () => {
    const variantId = new ObjectId();
    const calls: Doc[] = [];
    const doc: Doc = { _id: variantId, ownerType: 'partner', ownerId: 'p', name: 'VIP', slug: 'vip', periodPreset: 'all_time' };
    const db = {
      collection: () => ({
        findOne: jest.fn(async () => ({ ...doc })),
        updateOne: jest.fn(async (_f: Doc, update: Doc) => {
          calls.push(update);
          return { matchedCount: 1 };
        }),
        updateMany: jest.fn(async () => ({ matchedCount: 0 })),
      }),
    };
    jest.doMock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => db }) }));
    const { updateReportVariant } = jest.requireActual('@/lib/reportVariants');

    await updateReportVariant(db, String(variantId), { logoUrl: null, emoji: 'x', updatedAt: null, customDateRange: null });

    const [update] = calls;
    expect(update.$set.emoji).toBe('x');
    expect(update.$unset).toEqual({ logoUrl: '' });
    for (const path of Object.keys(update.$unset)) expect(update.$set).not.toHaveProperty(path);
  });
});

describe('PUT /api/projects: the project id is the 24-hex string, nothing else', () => {
  // WHAT: ObjectId.isValid({ id: '<hex>' }) is true and new ObjectId() resolves
  //     it to the event, but the grant check compares page ids as strings and
  //     dropped it -- so a password set on the event's _id to cut off an
  //     earlier grant was left out, and the save went through.
  function putProject(body: Doc) {
    return new NextRequest('http://localhost/api/projects', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('a password set on the _id still stops a grant holder who sends the id in another form', async () => {
    const p = project();
    const id = String(p._id);
    const { world, db, adopt } = setup({ projects: [p] });
    const { requireProjectWriteAccess, hasProjectWriteGrant } = await import('@/lib/apiGuards');
    const { GET } = await import('@/app/api/projects/edit/[slug]/route');
    const { PUT } = await import('@/app/api/projects/route');

    // Opened by its link while unprotected: a grant for edit:<editSlug>.
    adopt(await GET(editGet(EDIT_SLUG), { params: Promise.resolve({ slug: EDIT_SLUG }) }));
    // An hour later an admin sets the edit password on the event's _id.
    nowMs = START + HOUR_MS;
    setPassword(world, `edit:${id}`);

    const plain = await PUT(putProject({ projectId: id, statsChanges: { female: 5 } }));
    expect(plain.status).toBe(401);

    const wrapped = await PUT(putProject({ projectId: { id }, statsChanges: { female: 7 } }));
    expect(wrapped.status).toBe(400);
    expect((await wrapped.json()).error).toBe('Invalid project ID');

    // Upper case is the same id: checked, and refused, in its canonical form.
    const upper = await PUT(putProject({ projectId: id.toUpperCase(), statsChanges: { female: 9 } }));
    expect(upper.status).toBe(401);

    expect(world.projectUpdates).toEqual([]);

    // The guard itself refuses an id that is not the 24-hex string.
    expect((await requireProjectWriteAccess(db, { id } as unknown as string)).allowed).toBe(false);
    expect((await requireProjectWriteAccess(db, 'x'.repeat(12))).allowed).toBe(false);
    expect(await hasProjectWriteGrant(EDIT_SLUG, { id } as unknown as string)).toBe(false);
  });

  it('a signed-in admin sending an upper-case id writes the event by its canonical id', async () => {
    const p = project();
    const id = String(p._id);
    const { world } = setup({ admin: true, projects: [p] });
    const { PUT } = await import('@/app/api/projects/route');

    const res = await PUT(putProject({ projectId: id.toUpperCase(), statsChanges: { female: 3 } }));
    expect(res.status).toBe(200);
    expect(String(world.projectUpdates[0].filter._id)).toBe(id);
  });
});

describe('signed-in accounts below admin write the editor fields only', () => {
  // WHAT: getAdminUser() answers for every approved account; the admin-only
  //     fields follow requireAdmin's rule (admin, superadmin), as POST and
  //     DELETE on the same routes do (F-025 / #400).
  function putProject(body: Doc) {
    return new NextRequest('http://localhost/api/projects', { method: 'PUT', body: JSON.stringify(body) });
  }
  function putPartner(body: Doc) {
    return new NextRequest('http://localhost/api/partners', { method: 'PUT', body: JSON.stringify(body) });
  }

  it.each(['guest', 'user', 'api'])('a %s session saves stats but not name, date, partners, template or style', async (role) => {
    const p = project();
    const { world, db } = setup({ admin: true, role, projects: [p] });
    const { requireProjectWriteAccess } = await import('@/lib/apiGuards');
    const { PUT } = await import('@/app/api/projects/route');

    expect(await requireProjectWriteAccess(db, String(p._id))).toEqual({ allowed: true, via: 'session', isAdmin: false });

    const res = await PUT(
      putProject({
        projectId: String(p._id),
        statsChanges: { female: 4 },
        eventName: 'Renamed',
        eventDate: '2020-01-01',
        partner1Id: String(new ObjectId()),
        partner2Id: null,
        reportTemplateId: null,
        styleId: String(new ObjectId()),
      })
    );
    expect(res.status).toBe(200);
    const { update } = world.projectUpdates[0];
    expect(update.$set['stats.female']).toBe(4);
    for (const field of ['eventName', 'eventDate', 'partner1Id', 'reportTemplateId', 'styleIdEnhanced']) {
      expect(update.$set).not.toHaveProperty(field);
    }
    expect(update.$unset).toBeUndefined();
  });

  it('a superadmin session still changes every field', async () => {
    const p = project();
    const { world } = setup({ admin: true, role: 'superadmin', projects: [p] });
    const { PUT } = await import('@/app/api/projects/route');
    const partner1Id = String(new ObjectId());

    const res = await PUT(putProject({ projectId: String(p._id), eventName: 'Renamed', partner1Id }));
    expect(res.status).toBe(200);
    expect(world.projectUpdates[0].update.$set.eventName).toBe('Renamed');
    expect(String(world.projectUpdates[0].update.$set.partner1Id)).toBe(partner1Id);
  });

  it('a guest session on PUT /api/partners writes the editor fields only', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, role: 'guest', partners: [pt] });
    const { PUT } = await import('@/app/api/partners/route');

    const res = await PUT(
      putPartner({
        partnerId: String(pt._id),
        name: 'Renamed',
        hashtags: ['x'],
        googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/other',
        clickerSetId: String(new ObjectId()),
        statsChanges: { reportText1: 'hello' },
      })
    );
    expect(res.status).toBe(200);
    const set = world.partnerUpdates[0].update.$set;
    expect(set).toHaveProperty(['stats.reportText1'], 'hello');
    for (const adminField of ['name', 'hashtags', 'googleSheetsUrl', 'clickerSetId']) {
      expect(set).not.toHaveProperty(adminField);
    }
  });
});

describe('PUT /api/partners and the variant route: late-write guard and time limit', () => {
  const TAB = 'tab_7f3a9c21-e4';
  function putPartner(body: Doc) {
    return new NextRequest('http://localhost/api/partners', { method: 'PUT', body: JSON.stringify(body) });
  }

  it('records the save number; an older or repeated save from the same tab is answered stale and writes nothing', async () => {
    const pt = partner({ stats: { reportText1: 'old', reportText2: 'kept' } });
    const { world } = setup({ admin: true, partners: [pt] });
    const { PUT } = await import('@/app/api/partners/route');

    const newer = await PUT(putPartner({ partnerId: String(pt._id), statsChanges: { reportText1: 'new' }, tabId: TAB, clientSeq: 5 }));
    expect(await newer.json()).toMatchObject({ success: true });
    expect(world.partnerUpdates).toHaveLength(1);
    expect(world.partnerUpdates[0].update.$set).toMatchObject({ 'stats.reportText1': 'new', [`editorSeq.${TAB}`]: 5 });
    expect(world.partnerUpdates[0].update.$set).not.toHaveProperty('stats');

    for (const clientSeq of [4, 5]) {
      const late = await PUT(putPartner({ partnerId: String(pt._id), statsChanges: { reportText1: 'older' }, tabId: TAB, clientSeq }));
      expect(late.status).toBe(200);
      expect(await late.json()).toEqual({ success: true, stale: true });
    }
    expect(world.partnerUpdates).toHaveLength(1);
  });

  it('rejects a malformed tabId or clientSeq with 400 and writes nothing', async () => {
    const pt = partner();
    const { world } = setup({ admin: true, partners: [pt] });
    const { PUT } = await import('@/app/api/partners/route');

    for (const extra of [{ tabId: 'a.b', clientSeq: 1 }, { tabId: TAB }, { clientSeq: 2 }, { tabId: TAB, clientSeq: -1 }]) {
      const res = await PUT(putPartner({ partnerId: String(pt._id), statsChanges: { reportText1: 'x' }, ...extra }));
      expect(res.status).toBe(400);
    }
    expect(world.partnerUpdates).toEqual([]);
  });

  it('both partner save routes stop a request before the editor gives up on it', async () => {
    setup();
    const partners = await import('@/app/api/partners/route');
    const variants = await import('@/app/api/partners/edit/[slug]/route');
    const projects = await import('@/app/api/projects/route');
    expect(partners.maxDuration).toBe(20);
    expect(variants.maxDuration).toBe(20);
    expect(projects.maxDuration).toBe(20);
  });
});

describe('PUT /api/partners/edit/[slug]?variant=: field-level content and the late-write guard', () => {
  const TAB = 'tab_7f3a9c21-e4';
  function variantPut(body: Doc) {
    return new NextRequest(`http://localhost/api/partners/edit/${PARTNER_SLUG}?variant=vip`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  function variantWorld() {
    const pt = partner();
    const variantId = new ObjectId();
    const ctx = setup({
      admin: true,
      partners: [pt],
      variants: [
        {
          _id: variantId,
          ownerType: 'partner',
          ownerId: String(pt._id),
          name: 'VIP',
          slug: 'vip',
          statsOverrides: { reportText1: 'one', reportText2: 'two' },
        },
      ],
    });
    // The real updateReportVariant; the route's own read of the variant is
    // the copy taken when the request started.
    const readAtStart = ctx.world.variants.map((v) => ({ ...v, _id: String(v._id), statsOverrides: { ...v.statsOverrides } }));
    jest.doMock('@/lib/reportVariants', () => {
      const actual = jest.requireActual('@/lib/reportVariants');
      return { __esModule: true, ...actual, listReportVariants: jest.fn(async () => ({ variants: readAtStart })) };
    });
    return ctx;
  }

  it('writes only the slots named, as statsOverrides.<key> paths, so a slot saved meanwhile is kept', async () => {
    const { world } = variantWorld();
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');
    // Another device saves reportText2 after this request read the variant.
    world.variants[0].statsOverrides.reportText2 = 'two, from another device';

    const res = await PUT(variantPut({ metadata: { statsChanges: { reportText1: 'ONE' } }, tabId: TAB, clientSeq: 3 }), {
      params: Promise.resolve({ slug: PARTNER_SLUG }),
    });

    expect(res.status).toBe(200);
    const { update } = world.variantUpdates[0];
    expect(update.$set).toMatchObject({ 'statsOverrides.reportText1': 'ONE', [`editorSeq.${TAB}`]: 3 });
    expect(update.$set).not.toHaveProperty('statsOverrides');
    expect(world.variants[0].statsOverrides).toEqual({ reportText1: 'ONE', reportText2: 'two, from another device' });
  });

  it('a late or repeated save from the same tab is answered stale and changes nothing', async () => {
    const { world } = variantWorld();
    const { PUT } = await import('@/app/api/partners/edit/[slug]/route');
    const params = { params: Promise.resolve({ slug: PARTNER_SLUG }) };

    await PUT(variantPut({ metadata: { statsChanges: { reportText1: 'newer' } }, tabId: TAB, clientSeq: 8 }), params);
    const late = await PUT(variantPut({ metadata: { statsChanges: { reportText1: 'older' } }, tabId: TAB, clientSeq: 7 }), {
      params: Promise.resolve({ slug: PARTNER_SLUG }),
    });

    expect(await late.json()).toEqual({ success: true, stale: true });
    expect(world.variants[0].statsOverrides.reportText1).toBe('newer');
    expect(world.variantUpdates).toHaveLength(1);
  });
});
