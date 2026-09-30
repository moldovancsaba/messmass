// tests/projects-put-save-path.test.ts
// WHAT: Pins the cost and the rate budget of the editor save path
//     (PUT /api/projects), against an in-memory stand-in for MongoDB.
// WHY: Incident 2026-09-27: an event operator typed match data into the live
//     editor for hours. Every click is a save, and every save ran a hashtag
//     cleanup that loaded EVERY project document (find({}).toArray()), on a
//     write budget of 30/min per IP + path that a fast operator can exceed.
//     These tests keep a stats-only save free of hashtag work, keep the
//     targeted cleanup correct (a hashtag still used elsewhere survives, the
//     last use is deleted), and keep the editor save paths on their own budget.
// HOW: The route runs for real; its database is a small in-memory fake that
//     understands the handful of query shapes the route sends. No network, no
//     real cluster (.env.local points at production).

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import {
  RATE_LIMITS,
  getRateLimitConfig,
  rateLimitMiddleware,
  clearRateLimitStore,
} from '@/lib/rateLimit';

type Doc = Record<string, any>;

// ---------------------------------------------------------------------------
// In-memory MongoDB stand-in
// ---------------------------------------------------------------------------

function getPath(doc: Doc, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (current, key) => (current && typeof current === 'object' ? (current as Doc)[key] : undefined),
    doc
  );
}

function matchValue(actual: unknown, condition: any): boolean {
  if (Array.isArray(actual)) return actual.some((element) => matchValue(element, condition));
  // ObjectId by value: jest.resetModules gives the route its own copy of the
  // mongodb module, so instanceof across the boundary is always false.
  if (condition && typeof condition === 'object' && typeof condition.toHexString === 'function') {
    return !!actual && typeof (actual as any).toHexString === 'function'
      && (actual as any).toHexString() === condition.toHexString();
  }
  if (condition && typeof condition === 'object' && '$regex' in condition) {
    return typeof actual === 'string' && new RegExp(condition.$regex, condition.$options).test(actual);
  }
  if (condition && typeof condition === 'object' && '$in' in condition) {
    return condition.$in.some((candidate: unknown) => matchValue(actual, candidate));
  }
  return actual === condition;
}

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return (condition as Doc[]).some((sub) => matches(doc, sub));
    return matchValue(getPath(doc, key), condition);
  });
}

function makeFakeDb(seed: { projects: Doc[]; hashtags: Doc[] }) {
  const projects = seed.projects.map((p) => ({ ...p }));
  const hashtags = seed.hashtags.map((h) => ({ ...h }));

  const projectsCollection = {
    // A full scan is exactly what the save path must never do again.
    find: jest.fn(() => ({ toArray: async () => projects.map((p) => ({ ...p })) })),
    findOne: jest.fn(async (filter: Doc) => {
      const found = projects.find((p) => matches(p, filter));
      return found ? { ...found } : null;
    }),
    countDocuments: jest.fn(async (filter: Doc, options?: { limit?: number }) => {
      const count = projects.filter((p) => matches(p, filter)).length;
      return options?.limit ? Math.min(count, options.limit) : count;
    }),
    updateOne: jest.fn(async (filter: Doc, update: Doc) => {
      const target = projects.find((p) => matches(p, filter));
      if (!target) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(target, update.$set || {});
      for (const key of Object.keys(update.$unset || {})) delete target[key];
      return { matchedCount: 1, modifiedCount: 1 };
    }),
    deleteOne: jest.fn(async (filter: Doc) => {
      const index = projects.findIndex((p) => matches(p, filter));
      if (index === -1) return { deletedCount: 0 };
      projects.splice(index, 1);
      return { deletedCount: 1 };
    }),
  };

  const hashtagsCollection = {
    updateOne: jest.fn(async (filter: Doc, update: Doc, options?: { upsert?: boolean }) => {
      const target = hashtags.find((h) => matches(h, filter));
      if (target) {
        for (const [key, amount] of Object.entries(update.$inc || {})) {
          target[key] = (target[key] || 0) + (amount as number);
        }
        return { matchedCount: 1 };
      }
      if (options?.upsert) hashtags.push({ ...filter, ...(update.$setOnInsert || {}) });
      return { matchedCount: 0 };
    }),
    deleteMany: jest.fn(async (filter: Doc) => {
      const before = hashtags.length;
      for (let i = hashtags.length - 1; i >= 0; i -= 1) {
        if (matches(hashtags[i], filter)) hashtags.splice(i, 1);
      }
      return { deletedCount: before - hashtags.length };
    }),
  };

  const other = {
    findOne: jest.fn(async () => null),
    updateOne: jest.fn(async () => ({ matchedCount: 1 })),
  };

  const db = {
    admin: () => ({ ping: async () => ({ ok: 1 }) }),
    collection: jest.fn((name: string) => {
      if (name === 'projects') return projectsCollection;
      if (name === 'hashtags') return hashtagsCollection;
      return other;
    }),
  };

  return { db, projects, hashtags, projectsCollection, hashtagsCollection };
}

type FakeDb = ReturnType<typeof makeFakeDb>;

function mockRouteDependencies(fake: FakeDb, guard: jest.Mock = jest.fn(async () => null)) {
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({ db: () => fake.db }),
  }));
  jest.doMock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'messmass-test' } }));
  // `guard` answers as requireProjectWrite would (null, or the response to
  // return); the route asks requireProjectWriteAccess, which wraps it. A pass
  // is an admin session, so the whole body is writable (field limits for
  // everyone else are covered in tests/security/editor-write-access.test.ts).
  jest.doMock('@/lib/apiGuards', () => ({
    __esModule: true,
    requireAdmin: jest.fn(async () => null),
    requireProjectWriteAccess: jest.fn(async (...args: unknown[]) => {
      const denied = await (guard as (...a: unknown[]) => Promise<unknown>)(...args);
      return denied ? { allowed: false, response: denied } : { allowed: true, via: 'session', isAdmin: true };
    }),
    pickWritableFields: jest.fn((body: Doc) => body),
    EVENT_EDITOR_WRITABLE_FIELDS: [],
  }));
  jest.doMock('@/lib/notificationUtils', () => ({
    __esModule: true,
    createNotification: jest.fn(async () => true),
    getCurrentActor: jest.fn(async () => ({ id: null, name: 'Operator' })),
  }));
  jest.doMock('@/lib/bitly-recalculator', () => ({
    __esModule: true,
    recalculateProjectLinks: jest.fn(async () => 0),
    handleProjectDeletion: jest.fn(async () => 0),
    createLinkAssociation: jest.fn(async () => undefined),
  }));
  jest.doMock('@/lib/slugUtils', () => ({ __esModule: true, generateProjectSlugs: jest.fn() }));
  jest.doMock('@/lib/logger', () => ({
    __esModule: true,
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }));
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EVENT_ID = new ObjectId();
const OTHER_EVENT_ID = new ObjectId();

function eventDoc(overrides: Doc = {}): Doc {
  return {
    _id: EVENT_ID,
    eventName: 'PZPN x Bosnia and Herzegovina',
    eventDate: '2026-09-27',
    viewSlug: 'view-slug',
    editSlug: 'edit-slug',
    hashtags: ['football'],
    categorizedHashtags: { country: ['poland'] },
    stats: { remoteImages: 0, hostessImages: 0, selfies: 0 },
    ...overrides,
  };
}

function otherEventDoc(overrides: Doc = {}): Doc {
  return {
    _id: OTHER_EVENT_ID,
    eventName: 'Other event',
    eventDate: '2026-09-20',
    hashtags: [],
    categorizedHashtags: {},
    stats: {},
    ...overrides,
  };
}

function putBody(overrides: Doc = {}): Doc {
  return {
    projectId: EVENT_ID.toString(),
    eventName: 'PZPN x Bosnia and Herzegovina',
    eventDate: '2026-09-27',
    hashtags: ['football'],
    categorizedHashtags: { country: ['poland'] },
    stats: { remoteImages: 12, hostessImages: 3, selfies: 7 },
    ...overrides,
  };
}

async function callPut(body: Doc) {
  const { PUT } = await import('@/app/api/projects/route');
  return PUT(
    new NextRequest('http://localhost/api/projects', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// PUT /api/projects hashtag work
// ---------------------------------------------------------------------------

describe('PUT /api/projects - editor save cost', () => {
  it('a stats-only save does no hashtag work and never scans the projects collection', async () => {
    const fake = makeFakeDb({
      projects: [eventDoc(), otherEventDoc()],
      hashtags: [
        { hashtag: 'football', count: 1 },
        { hashtag: 'country:poland', count: 1 },
      ],
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(fake.projects[0].stats.remoteImages).toBe(12);

    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.projectsCollection.countDocuments).not.toHaveBeenCalled();
    expect(fake.hashtagsCollection.updateOne).not.toHaveBeenCalled();
    expect(fake.hashtagsCollection.deleteMany).not.toHaveBeenCalled();
    expect(fake.hashtags).toEqual([
      { hashtag: 'football', count: 1 },
      { hashtag: 'country:poland', count: 1 },
    ]);
  });

  it('removing a hashtag that another event still uses keeps it', async () => {
    const fake = makeFakeDb({
      projects: [
        eventDoc({ hashtags: ['football', 'derby'] }),
        otherEventDoc({ hashtags: ['Derby'] }), // stored case differs; the representation is lowercase
      ],
      hashtags: [
        { hashtag: 'football', count: 1 },
        { hashtag: 'derby', count: 2 },
        { hashtag: 'country:poland', count: 1 },
      ],
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody({ hashtags: ['football'] }));

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.projectsCollection.countDocuments).toHaveBeenCalledTimes(1);
    expect(fake.hashtags).toContainEqual({ hashtag: 'derby', count: 1 });
    expect(fake.hashtagsCollection.deleteMany).not.toHaveBeenCalled();
  });

  it('removing the last use of a hashtag deletes it, and only it', async () => {
    const fake = makeFakeDb({
      projects: [eventDoc({ hashtags: ['football', 'cup-final'] }), otherEventDoc({ hashtags: ['football'] })],
      hashtags: [
        { hashtag: 'football', count: 2 },
        { hashtag: 'cup-final', count: 1 },
        { hashtag: 'country:poland', count: 1 },
        // Untouched by this save: the old full sweep would have deleted it.
        { hashtag: 'orphan-from-elsewhere', count: 0 },
      ],
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody({ hashtags: ['football'] }));

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.hashtagsCollection.deleteMany).toHaveBeenCalledWith({ hashtag: { $in: ['cup-final'] } });
    expect(fake.hashtags.map((h) => h.hashtag).sort()).toEqual(
      ['country:poland', 'football', 'orphan-from-elsewhere']
    );
  });

  it('applies the same rules to category-prefixed hashtags', async () => {
    const fake = makeFakeDb({
      projects: [
        eventDoc({ categorizedHashtags: { country: ['poland', 'bosnia'] } }),
        otherEventDoc({ categorizedHashtags: { country: ['Poland'] } }),
      ],
      hashtags: [
        { hashtag: 'football', count: 1 },
        { hashtag: 'country:poland', count: 2 },
        { hashtag: 'country:bosnia', count: 1 },
      ],
    });
    mockRouteDependencies(fake);

    // Both categorized hashtags removed: poland is still used by the other
    // event, bosnia was only used here.
    const res = await callPut(putBody({ categorizedHashtags: {} }));

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.hashtagsCollection.deleteMany).toHaveBeenCalledWith({ hashtag: { $in: ['country:bosnia'] } });
    expect(fake.hashtags).toContainEqual({ hashtag: 'country:poland', count: 1 });
    expect(fake.hashtags.find((h) => h.hashtag === 'country:bosnia')).toBeUndefined();
  });

  it('a plain hashtag is not kept alive by the same word inside a category', async () => {
    // getAllHashtagRepresentations stores "poland" and "country:poland" as two
    // different representations, so a categorized use does not count as a
    // plain one.
    const fake = makeFakeDb({
      projects: [
        eventDoc({ hashtags: ['football', 'poland'], categorizedHashtags: {} }),
        otherEventDoc({ categorizedHashtags: { country: ['poland'] } }),
      ],
      hashtags: [
        { hashtag: 'football', count: 1 },
        { hashtag: 'poland', count: 1 },
        { hashtag: 'country:poland', count: 1 },
      ],
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody({ hashtags: ['football'], categorizedHashtags: {} }));

    expect(res.status).toBe(200);
    expect(fake.hashtags.map((h) => h.hashtag).sort()).toEqual(['country:poland', 'football']);
  });

  it('checks removed hashtags one at a time, never as concurrent scans', async () => {
    const fake = makeFakeDb({
      projects: [eventDoc({ hashtags: ['football', 'alpha', 'beta', 'gamma', 'delta'] }), otherEventDoc()],
      hashtags: ['football', 'alpha', 'beta', 'gamma', 'delta'].map((hashtag) => ({ hashtag, count: 1 })),
    });
    // Each check yields to the event loop before answering, so checks started
    // together (Promise.all) would overlap and push inFlight above 1.
    const originalCount = fake.projectsCollection.countDocuments.getMockImplementation()!;
    let inFlight = 0;
    let maxInFlight = 0;
    fake.projectsCollection.countDocuments.mockImplementation(async (filter: Doc, options?: { limit?: number }) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setImmediate(resolve));
      inFlight -= 1;
      return originalCount(filter, options);
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody({ hashtags: ['football'] }));

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.countDocuments).toHaveBeenCalledTimes(4);
    expect(maxInFlight).toBe(1);
    expect(fake.hashtags.map((h) => h.hashtag)).toEqual(['football']);
  });

  it('caps the checks per request; skipped hashtags keep their count docs and the skip is logged', async () => {
    // 25 plain hashtags, all removed in one save. Representations are sorted,
    // so tag-00..tag-19 are checked and tag-20..tag-24 are skipped.
    const tags = Array.from({ length: 25 }, (_, i) => `tag-${String(i).padStart(2, '0')}`);
    const fake = makeFakeDb({
      projects: [
        eventDoc({ hashtags: ['football', ...tags] }),
        otherEventDoc({ hashtags: ['tag-01'] }), // still in use elsewhere
      ],
      hashtags: [
        { hashtag: 'football', count: 1 },
        { hashtag: 'country:poland', count: 1 },
        ...tags.map((hashtag) => ({ hashtag, count: hashtag === 'tag-01' ? 2 : 1 })),
      ],
    });
    mockRouteDependencies(fake);

    const res = await callPut(putBody({ hashtags: ['football'] }));
    const logger = await import('@/lib/logger');

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.projectsCollection.countDocuments).toHaveBeenCalledTimes(20);

    const checkedUnused = tags.slice(0, 20).filter((tag) => tag !== 'tag-01');
    expect(fake.hashtagsCollection.deleteMany).toHaveBeenCalledTimes(1);
    expect(fake.hashtagsCollection.deleteMany).toHaveBeenCalledWith({ hashtag: { $in: checkedUnused } });

    // Still used: kept. Skipped: not deleted, left at the decremented count.
    expect(fake.hashtags).toContainEqual({ hashtag: 'tag-01', count: 1 });
    for (const skipped of tags.slice(20)) {
      expect(fake.hashtags).toContainEqual({ hashtag: skipped, count: 0 });
    }
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Hashtag cleanup capped'),
      expect.objectContaining({ checked: 20, skipped: 5, limit: 20 })
    );
  });

  it('still runs the F-009 write guard before touching anything', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [] });
    const { NextResponse } = await import('next/server');
    const guard = jest.fn(async () => NextResponse.json({ success: false }, { status: 401 }));
    mockRouteDependencies(fake, guard);

    const res = await callPut(putBody());

    expect(res.status).toBe(401);
    expect(guard).toHaveBeenCalledWith(fake.db, EVENT_ID.toString());
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
    expect(fake.projects[0].stats.remoteImages).toBe(0);
  });
});

describe('DELETE /api/projects - hashtag cleanup', () => {
  it('cleans up only the deleted event\'s hashtags, without a full scan', async () => {
    const fake = makeFakeDb({
      projects: [
        eventDoc({ hashtags: ['derby', 'solo'], categorizedHashtags: {} }),
        otherEventDoc({ hashtags: ['derby'] }),
      ],
      hashtags: [
        { hashtag: 'derby', count: 2 },
        { hashtag: 'solo', count: 1 },
        { hashtag: 'orphan-from-elsewhere', count: 0 },
      ],
    });
    mockRouteDependencies(fake);

    const { DELETE } = await import('@/app/api/projects/route');
    const res = await DELETE(
      new NextRequest(`http://localhost/api/projects?projectId=${EVENT_ID.toString()}`, { method: 'DELETE' })
    );

    expect(res.status).toBe(200);
    expect(fake.projectsCollection.find).not.toHaveBeenCalled();
    expect(fake.hashtags.map((h) => h.hashtag).sort()).toEqual(['derby', 'orphan-from-elsewhere']);
  });
});

// ---------------------------------------------------------------------------
// Rate limit budget
// ---------------------------------------------------------------------------

function request(method: string, path: string) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'x-forwarded-for': '203.0.113.7' },
  });
}

describe('getRateLimitConfig - editor save budget', () => {
  it.each([
    ['PUT', '/api/projects'],
    ['PUT', '/api/partners'],
    ['PUT', '/api/partners/edit/6650f0c2a1b2c3d4e5f60718'],
    ['PUT', '/api/partners/edit/some-view-slug'],
  ])('%s %s uses the editor save budget', (method, path) => {
    const config = getRateLimitConfig(request(method, path));
    expect(config).toBe(RATE_LIMITS.EDITOR_SAVE);
    expect(config.maxRequests).toBe(120);
    expect(config.windowMs).toBe(60 * 1000);
  });

  it.each([
    ['POST', '/api/projects'],
    ['DELETE', '/api/projects'],
    ['POST', '/api/partners'],
    ['DELETE', '/api/partners'],
    ['PUT', '/api/projects/6650f0c2a1b2c3d4e5f60718'],
    ['PUT', '/api/partners/edit/abc/extra'],
    ['PUT', '/api/hashtags'],
    ['POST', '/api/hashtags'],
  ])('%s %s keeps the generic WRITE budget', (method, path) => {
    expect(getRateLimitConfig(request(method, path))).toBe(RATE_LIMITS.WRITE);
  });

  it('reads stay on the READ budget', () => {
    expect(getRateLimitConfig(request('GET', '/api/projects'))).toBe(RATE_LIMITS.READ);
  });

  it('lets 120 saves through in a minute and refuses the 121st; other writes still stop after 30', async () => {
    clearRateLimitStore();

    const save = request('PUT', '/api/projects');
    for (let i = 0; i < 120; i += 1) {
      expect(await rateLimitMiddleware(save, getRateLimitConfig(save))).toBeNull();
    }
    const refused = await rateLimitMiddleware(save, getRateLimitConfig(save));
    expect(refused?.status).toBe(429);

    const create = request('POST', '/api/hashtags');
    for (let i = 0; i < 30; i += 1) {
      expect(await rateLimitMiddleware(create, getRateLimitConfig(create))).toBeNull();
    }
    expect((await rateLimitMiddleware(create, getRateLimitConfig(create)))?.status).toBe(429);

    clearRateLimitStore();
  });
});
