// tests/projects-put-field-level.test.ts
// WHAT: The event editor's field-level save through PUT /api/projects:
//     `statsChanges` writes only the stats it names, hashtags change only when
//     sent, a grant holder cannot change the event's name, date or admin
//     references, and a late save from a tab never overwrites a newer one.
// WHY: The editor used to send its whole stats object and PUT replaced the
//     stored one with it. A value someone else stored since the tab loaded --
//     fanmass results landing mid-event, a sheet pull, an admin, a second
//     device -- was put back to the tab's old copy by its next click, and the
//     save was still confirmed. A retried save could also land after a newer
//     one and put older values back.
// HOW: The route runs for real against an in-memory stand-in for MongoDB that
//     applies dotted $set/$unset paths and the late-write guard's filter the
//     way the server does. The write guard is mocked to answer as an admin
//     session or as an edit grant; which fields a grant may write comes from
//     the real lib/apiGuards list. No network, no real cluster (.env.local
//     points at production).

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

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

function setPath(doc: Doc, path: string, value: unknown) {
  const keys = path.split('.');
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (target[key] === undefined) target[key] = {};
    if (!target[key] || typeof target[key] !== 'object') {
      throw new Error(`Cannot create field in element {${key}: ${JSON.stringify(target[key])}}`);
    }
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

function unsetPath(doc: Doc, path: string) {
  const keys = path.split('.');
  const parent = getPath(doc, keys.slice(0, -1).join('.')) ?? (keys.length === 1 ? doc : undefined);
  if (parent && typeof parent === 'object') delete (parent as Doc)[keys[keys.length - 1]];
}

function matchValue(actual: unknown, condition: any): boolean {
  if (condition && typeof condition === 'object' && typeof condition.toHexString === 'function') {
    return !!actual && typeof (actual as any).toHexString === 'function'
      && (actual as any).toHexString() === condition.toHexString();
  }
  if (condition && typeof condition === 'object' && '$not' in condition) {
    return !matchValue(actual, condition.$not);
  }
  if (condition && typeof condition === 'object' && '$gte' in condition) {
    return typeof actual === 'number' && actual >= condition.$gte;
  }
  if (condition && typeof condition === 'object' && '$lt' in condition) {
    return typeof actual === 'number' && actual < condition.$lt;
  }
  if (Array.isArray(actual)) return actual.some((element) => matchValue(element, condition));
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

function applyUpdate(doc: Doc, update: Doc) {
  const setPaths = Object.keys(update.$set || {});
  const unsetPaths = Object.keys(update.$unset || {});
  const incPaths = Object.keys(update.$inc || {});
  // MongoDB refuses an update that names one path twice, or a path and its parent.
  const all = [...setPaths, ...unsetPaths, ...incPaths];
  for (const a of all) {
    for (const b of all) {
      if (a !== b && (b.startsWith(`${a}.`))) throw new Error(`Updating the path '${b}' would create a conflict at '${a}'`);
    }
  }
  if (new Set(all).size !== all.length) throw new Error('Updating the same path twice would create a conflict');
  for (const [path, value] of Object.entries(update.$set || {})) setPath(doc, path, value);
  for (const path of unsetPaths) unsetPath(doc, path);
  // $inc: a missing field counts from 0; anything but a number is refused.
  for (const [path, amount] of Object.entries(update.$inc || {})) {
    const current = getPath(doc, path);
    if (current !== undefined && typeof current !== 'number') {
      throw new Error(`Cannot apply $inc to a value of non-numeric type. {${path}: ${JSON.stringify(current)}}`);
    }
    setPath(doc, path, (current ?? 0) + (amount as number));
  }
}

// Deep copy that keeps ObjectIds (structuredClone turns them into plain objects).
function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as unknown as T;
  if (value && typeof value === 'object' && typeof (value as any).toHexString !== 'function') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) as T;
  }
  return value;
}

function makeFakeDb(seed: { projects: Doc[]; hashtags?: Doc[] }) {
  const projects = seed.projects.map((p) => clone(p));
  const hashtags = (seed.hashtags ?? []).map((h) => ({ ...h }));
  // Runs just before the route's write is applied: another writer landing
  // between the route's read and its write.
  let beforeWrite: (() => void) | null = null;

  const projectsCollection = {
    find: jest.fn(() => ({ toArray: async () => projects.map((p) => clone(p)) })),
    findOne: jest.fn(async (filter: Doc) => {
      const found = projects.find((p) => matches(p, filter));
      return found ? clone(found) : null;
    }),
    countDocuments: jest.fn(async (filter: Doc, options?: { limit?: number }) => {
      const count = projects.filter((p) => matches(p, filter)).length;
      return options?.limit ? Math.min(count, options.limit) : count;
    }),
    updateOne: jest.fn(async (filter: Doc, update: Doc) => {
      if (beforeWrite) {
        const hook = beforeWrite;
        beforeWrite = null;
        hook();
      }
      const target = projects.find((p) => matches(p, filter));
      if (!target) return { matchedCount: 0, modifiedCount: 0 };
      applyUpdate(target, update);
      return { matchedCount: 1, modifiedCount: 1 };
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
    deleteMany: jest.fn(async () => ({ deletedCount: 0 })),
  };

  const reportStyles = { findOne: jest.fn(async () => ({ _id: 'exists' })) };

  const db = {
    admin: () => ({ ping: async () => ({ ok: 1 }) }),
    collection: jest.fn((name: string) => {
      if (name === 'projects') return projectsCollection;
      if (name === 'hashtags') return hashtagsCollection;
      if (name === 'report_styles') return reportStyles;
      throw new Error(`Unexpected collection ${name}`);
    }),
  };

  return {
    db,
    projects,
    hashtags,
    projectsCollection,
    hashtagsCollection,
    onNextWrite: (hook: () => void) => {
      beforeWrite = hook;
    },
  };
}

type FakeDb = ReturnType<typeof makeFakeDb>;

// `via` is how requireProjectWriteAccess let the caller in: 'session' is an
// admin session, 'member-session' a signed-in account below admin (guest,
// user), 'page-grant' an edit grant. `writableFields` replaces
// EVENT_EDITOR_WRITABLE_FIELDS when a test models that list drifting.
function mockRouteDependencies(
  fake: FakeDb,
  via: 'session' | 'member-session' | 'page-grant',
  writableFields?: readonly string[]
) {
  const notifications: Doc[] = [];
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({ db: () => fake.db }),
  }));
  jest.doMock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'messmass-test' } }));
  jest.doMock('@/lib/auth', () => ({ __esModule: true, getAdminUser: jest.fn(async () => null) }));
  jest.doMock('@/lib/apiGuards', () => {
    const actual = jest.requireActual('@/lib/apiGuards');
    return {
      __esModule: true,
      ...actual,
      requireAdmin: jest.fn(async () => null),
      requireProjectWriteAccess: jest.fn(async () => ({
        allowed: true,
        via: via === 'page-grant' ? 'page-grant' : 'session',
        isAdmin: via === 'session',
      })),
      ...(writableFields ? { EVENT_EDITOR_WRITABLE_FIELDS: writableFields } : {}),
    };
  });
  jest.doMock('@/lib/notificationUtils', () => ({
    __esModule: true,
    createNotification: jest.fn(async (_db: unknown, notification: Doc) => {
      notifications.push(notification);
      return true;
    }),
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
  return { notifications };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EVENT_ID = new ObjectId();
const TAB = 'tab_7f3a9c21-e4';
const OTHER_TAB = 'tab_0b8d44aa-91';

// Stored stats already carry their totals, as every saved event's do.
function eventDoc(overrides: Doc = {}): Doc {
  return {
    _id: EVENT_ID,
    eventName: 'PZPN x Bosnia and Herzegovina',
    eventDate: '2026-09-27',
    viewSlug: 'view-slug',
    editSlug: '2f1c7a4e-8b3d-4c5e-9f6a-1b2c3d4e5f60',
    hashtags: ['football'],
    categorizedHashtags: { country: ['poland'] },
    stats: {
      female: 10,
      male: 12,
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      allImages: 0,
      remoteFans: 0,
      totalFans: 0,
      stadium: 0,
      fanmassFans: 100,
      fanmass: { lastSyncAt: '2026-09-27T18:00:00Z', fans: 100 },
    },
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

const id = EVENT_ID.toString();

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Field-level stats
// ---------------------------------------------------------------------------

describe('PUT /api/projects - statsChanges writes only the stats it names', () => {
  it('sets only the named keys, as stats.<key> paths, never the whole stats object', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [{ hashtag: 'football', count: 1 }] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { female: 11 } });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, modified: true });
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(Object.keys(update.$set).sort()).toEqual(['stats.female', 'updatedAt']);
    expect(update.$set).not.toHaveProperty('stats');
    expect(update.$set).not.toHaveProperty('hashtags');
    expect(update.$unset).toBeUndefined();
    expect(fake.projects[0].stats).toEqual({ ...eventDoc().stats, female: 11 });
  });

  it('a fanmass write landing between the read and the write survives the save', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');
    fake.onNextWrite(() => {
      // As lib/fanmassIntegration.ts writes results: dotted paths, its own keys.
      fake.projects[0].stats.fanmassFans = 250;
      fake.projects[0].stats.fanmass = { lastSyncAt: '2026-09-27T19:00:00Z', fans: 250 };
    });

    const res = await callPut({ projectId: id, statsChanges: { female: 11, male: 13 } });

    expect(res.status).toBe(200);
    expect(fake.projects[0].stats.female).toBe(11);
    expect(fake.projects[0].stats.male).toBe(13);
    expect(fake.projects[0].stats.fanmassFans).toBe(250);
    expect(fake.projects[0].stats.fanmass).toEqual({ lastSyncAt: '2026-09-27T19:00:00Z', fans: 250 });
  });

  it('a value stored since the tab loaded is not put back by the tab\'s next click', async () => {
    // The tab loaded fanmassFans 100; fanmass has since stored 250. The tab's
    // click changes female only, so it names female only.
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { ...eventDoc().stats, fanmassFans: 250 } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { female: 11 } });

    expect(res.status).toBe(200);
    expect(fake.projects[0].stats.fanmassFans).toBe(250);
  });

  it('a null value removes the key; statsRemoved does the same', async () => {
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { ...eventDoc().stats, reportText1: 'x', reportText2: 'y' } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { reportText1: null }, statsRemoved: ['reportText2'] });

    expect(res.status).toBe(200);
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(update.$unset).toEqual({ 'stats.reportText1': '', 'stats.reportText2': '' });
    expect(fake.projects[0].stats).not.toHaveProperty('reportText1');
    expect(fake.projects[0].stats).not.toHaveProperty('reportText2');
    expect(fake.projects[0].stats.female).toBe(10);
  });

  it('writes a derived total only when it changes, and fills one a removal took away', async () => {
    // No totals stored yet: the save fills them in from the merged stats.
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { remoteImages: 2, hostessImages: 1, selfies: 0, stadium: 5, totalFans: 5 } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { selfies: 4, totalFans: null } });

    expect(res.status).toBe(200);
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(update.$set).toMatchObject({
      'stats.selfies': 4,
      'stats.allImages': 7,
      'stats.remoteFans': 0,
      // Removed, then recomputed: set, never both set and unset.
      'stats.totalFans': 5,
    });
    expect(update.$set).not.toHaveProperty('stats.remoteImages');
    expect(update.$set).not.toHaveProperty('stats.stadium');
    expect(update.$unset).toBeUndefined();
  });

  it('a stats save leaves the hashtags and their counts alone', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [{ hashtag: 'football', count: 1 }] });
    mockRouteDependencies(fake, 'page-grant');

    await callPut({ projectId: id, statsChanges: { female: 11 } });

    expect(fake.projects[0].hashtags).toEqual(['football']);
    expect(fake.projects[0].categorizedHashtags).toEqual({ country: ['poland'] });
    expect(fake.hashtagsCollection.updateOne).not.toHaveBeenCalled();
  });

  it('hashtags sent with the save are stored and counted', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [{ hashtag: 'football', count: 1 }] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: {}, hashtags: ['football', 'derby'] });

    expect(res.status).toBe(200);
    expect(fake.projects[0].hashtags).toEqual(['football', 'derby']);
    expect(fake.hashtags).toContainEqual(expect.objectContaining({ hashtag: 'derby', count: 1 }));
    expect(fake.projects[0].categorizedHashtags).toEqual({ country: ['poland'] });
  });

  it('refuses both stats and statsChanges in one body', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'session');

    const res = await callPut({ projectId: id, stats: { female: 1 }, statsChanges: { female: 2 } });

    expect(res.status).toBe(400);
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
  });
});

describe('PUT /api/projects - statsChanges validation', () => {
  it.each([
    ['a dotted key', { 'a.b': 1 }],
    ['a leading $', { $x: 1 }],
    ['a $ inside', { a$b: 1 }],
    ['an empty key', { '': 1 }],
    ['a key over 100 characters', { ['k'.repeat(101)]: 1 }],
    ['an object value', { fanmass: { fans: 1 } }],
    ['a boolean value', { female: true }],
    ['an array value', { female: [1] }],
    ['a string over the size cap', { reportText1: 'x'.repeat(100_001) }],
  ])('rejects %s with 400 and writes nothing', async (_label, statsChanges) => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges });

    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
    expect(fake.projects[0]).toEqual(eventDoc());
  });

  it('rejects an invalid key in statsRemoved, and a key both changed and removed', async () => {
    for (const body of [
      { statsRemoved: ['a.b'] },
      { statsRemoved: ['$x'] },
      { statsChanges: { female: 1 }, statsRemoved: ['female'] },
      { statsChanges: [1, 2] },
    ]) {
      const fake = makeFakeDb({ projects: [eventDoc()] });
      mockRouteDependencies(fake, 'page-grant');
      const res = await callPut({ projectId: id, ...body });
      expect(res.status).toBe(400);
      expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
      jest.resetModules();
    }
  });

  it('accepts numbers, strings and null at the limits', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({
      projectId: id,
      statsChanges: { ['k'.repeat(100)]: 1.5, reportText1: 'x'.repeat(100_000), male: null, 'custom-var_2': 0 },
    });

    expect(res.status).toBe(200);
    expect(fake.projects[0].stats['k'.repeat(100)]).toBe(1.5);
    expect(fake.projects[0].stats).not.toHaveProperty('male');
  });
});

// ---------------------------------------------------------------------------
// Admin-only fields
// ---------------------------------------------------------------------------

describe('PUT /api/projects - a grant holder cannot change admin fields', () => {
  const adminFields = () => ({
    eventName: 'Renamed by the link',
    eventDate: '2020-01-01',
    styleId: String(new ObjectId()),
    reportTemplateId: String(new ObjectId()),
    partner1Id: String(new ObjectId()),
    partner2Id: null,
  });

  it.each([
    ['partial body', (extra: Doc) => ({ projectId: id, statsChanges: { female: 11 }, ...extra })],
    ['legacy full body', (extra: Doc) => ({ projectId: id, stats: { ...eventDoc().stats, female: 11 }, hashtags: ['football'], ...extra })],
  ])('ignores eventName, eventDate, style, template and partners in a %s', async (_label, build) => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    const { notifications } = mockRouteDependencies(fake, 'page-grant');

    const res = await callPut(build(adminFields()));

    expect(res.status).toBe(200);
    const stored = fake.projects[0];
    expect(stored.eventName).toBe('PZPN x Bosnia and Herzegovina');
    expect(stored.eventDate).toBe('2026-09-27');
    expect(stored).not.toHaveProperty('styleIdEnhanced');
    expect(stored).not.toHaveProperty('reportTemplateId');
    expect(stored).not.toHaveProperty('partner1Id');
    expect(stored.stats.female).toBe(11);
    const bitly = await import('@/lib/bitly-recalculator');
    expect(bitly.recalculateProjectLinks).not.toHaveBeenCalled();
    expect(notifications[0].projectName).toBe('PZPN x Bosnia and Herzegovina');
  });

  it('ignores them even if the shared writable-field list were to include them', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant', ['eventName', 'eventDate', 'partner1Id', 'statsChanges']);

    const res = await callPut({ projectId: id, statsChanges: { female: 11 }, ...adminFields() });

    expect(res.status).toBe(200);
    expect(fake.projects[0].eventName).toBe('PZPN x Bosnia and Herzegovina');
    expect(fake.projects[0].eventDate).toBe('2026-09-27');
    expect(fake.projects[0]).not.toHaveProperty('partner1Id');
  });

  it('an admin session still changes them, with a legacy full body', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'session');
    const fields = adminFields();

    const res = await callPut({ projectId: id, stats: { female: 3 }, ...fields });

    expect(res.status).toBe(200);
    const stored = fake.projects[0];
    expect(stored.eventName).toBe('Renamed by the link');
    expect(stored.eventDate).toBe('2020-01-01');
    expect(stored.styleIdEnhanced).toBe(fields.styleId);
    expect(String(stored.reportTemplateId)).toBe(fields.reportTemplateId);
    expect(String(stored.partner1Id)).toBe(fields.partner1Id);
    // Legacy body: stats replaced whole, as before.
    expect(stored.stats).toEqual({ female: 3, allImages: 0, remoteFans: 0, totalFans: 0 });
    const bitly = await import('@/lib/bitly-recalculator');
    expect(bitly.recalculateProjectLinks).toHaveBeenCalledTimes(1);
  });

  it('an admin session can also use the partial form', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'session');

    const res = await callPut({ projectId: id, statsChanges: { female: 11 }, eventName: 'Renamed' });

    expect(res.status).toBe(200);
    expect(fake.projects[0].eventName).toBe('Renamed');
    expect(fake.projects[0].stats.fanmassFans).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Late-write guard
// ---------------------------------------------------------------------------

describe('PUT /api/projects - late-write guard (tabId + clientSeq)', () => {
  it('records the save number, and a lower one from the same tab changes nothing', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [{ hashtag: 'football', count: 1 }] });
    const { notifications } = mockRouteDependencies(fake, 'page-grant');

    const newer = await callPut({ projectId: id, statsChanges: { female: 15 }, tabId: TAB, clientSeq: 5 });
    expect(newer.status).toBe(200);
    expect(fake.projects[0].editorSeq).toEqual({ [TAB]: 5 });
    const afterNewer = clone(fake.projects[0]);
    expect(notifications).toHaveLength(1);

    // The retried older save arrives last.
    const late = await callPut({
      projectId: id,
      statsChanges: { female: 12 },
      hashtags: ['football', 'late'],
      tabId: TAB,
      clientSeq: 4,
    });

    expect(late.status).toBe(200);
    expect(await late.json()).toEqual({ success: true, stale: true });
    expect(fake.projects[0]).toEqual(afterNewer);
    expect(fake.hashtags).toEqual([{ hashtag: 'football', count: 1 }]);
    expect(notifications).toHaveLength(1);
  });

  it('the same number again is stale too; a higher one lands', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    await callPut({ projectId: id, statsChanges: { female: 15 }, tabId: TAB, clientSeq: 5 });
    const again = await callPut({ projectId: id, statsChanges: { female: 99 }, tabId: TAB, clientSeq: 5 });
    expect((await again.json()).stale).toBe(true);
    expect(fake.projects[0].stats.female).toBe(15);

    const next = await callPut({ projectId: id, statsChanges: { female: 16 }, tabId: TAB, clientSeq: 6 });
    expect(await next.json()).toEqual({ success: true, modified: true });
    expect(fake.projects[0].stats.female).toBe(16);
    expect(fake.projects[0].editorSeq[TAB]).toBe(6);
  });

  it('each tab has its own sequence', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    await callPut({ projectId: id, statsChanges: { female: 15 }, tabId: TAB, clientSeq: 50 });
    const other = await callPut({ projectId: id, statsChanges: { male: 20 }, tabId: OTHER_TAB, clientSeq: 1 });

    expect((await other.json()).stale).toBeUndefined();
    expect(fake.projects[0].stats).toMatchObject({ female: 15, male: 20 });
    expect(fake.projects[0].editorSeq).toEqual({ [TAB]: 50, [OTHER_TAB]: 1 });
  });

  it('the write itself carries the guard, so a newer save that lands mid-request still wins', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');
    // Save 8 from the same tab lands after this request (save 7) read the
    // document but before it wrote.
    fake.onNextWrite(() => {
      fake.projects[0].stats.female = 18;
      fake.projects[0].editorSeq = { [TAB]: 8 };
    });

    const res = await callPut({ projectId: id, statsChanges: { female: 17 }, tabId: TAB, clientSeq: 7 });

    expect(await res.json()).toEqual({ success: true, stale: true });
    expect(fake.projects[0].stats.female).toBe(18);
  });

  it('a save without tabId/clientSeq is not guarded (admin forms, older tabs)', async () => {
    const fake = makeFakeDb({ projects: [eventDoc({ editorSeq: { [TAB]: 9 } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { female: 1 } });

    expect(res.status).toBe(200);
    expect(fake.projects[0].stats.female).toBe(1);
    expect(fake.projects[0].editorSeq).toEqual({ [TAB]: 9 });
  });

  it.each([
    ['a tabId that is too short', { tabId: 'abc', clientSeq: 1 }],
    ['a tabId with a dot', { tabId: 'tab.12345678', clientSeq: 1 }],
    ['a tabId with a $', { tabId: '$tab12345678', clientSeq: 1 }],
    ['a negative clientSeq', { tabId: TAB, clientSeq: -1 }],
    ['a fractional clientSeq', { tabId: TAB, clientSeq: 1.5 }],
    ['a string clientSeq', { tabId: TAB, clientSeq: '3' }],
    ['a tabId without clientSeq', { tabId: TAB }],
    ['a clientSeq without tabId', { clientSeq: 3 }],
  ])('rejects %s with 400 and writes nothing', async (_label, extra) => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsChanges: { female: 11 }, ...extra });

    expect(res.status).toBe(400);
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
  });

  it('an event deleted mid-request answers 404, not stale', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');
    fake.onNextWrite(() => {
      fake.projects.splice(0, 1);
    });

    const res = await callPut({ projectId: id, statsChanges: { female: 11 }, tabId: TAB, clientSeq: 1 });

    expect(res.status).toBe(404);
  });
});

describe('app/api/projects/route.ts - route segment config', () => {
  it('caps a request below the editor\'s 25 s save deadline', async () => {
    const fake = makeFakeDb({ projects: [] });
    mockRouteDependencies(fake, 'session');
    const route = await import('@/app/api/projects/route');
    expect(route.maxDuration).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Clicker counts (statsIncrements)
// ---------------------------------------------------------------------------

describe('PUT /api/projects - statsIncrements counts on from the stored value', () => {
  it('adds to the stored count with $inc, so taps from another device in the meantime are kept', async () => {
    // Devices A and B both start from female 10. B's 20 taps land between
    // this request's read and its write; A's 30 taps must add to them.
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');
    fake.onNextWrite(() => {
      fake.projects[0].stats.female += 20;
    });

    const res = await callPut({ projectId: id, statsIncrements: { female: 30 }, tabId: TAB, clientSeq: 1 });

    expect(res.status).toBe(200);
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(update.$inc).toEqual({ 'stats.female': 30 });
    expect(update.$set).not.toHaveProperty('stats.female');
    expect(fake.projects[0].stats.female).toBe(60);
  });

  it('two devices counting the same stat both count', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    await callPut({ projectId: id, statsIncrements: { female: 30 }, tabId: TAB, clientSeq: 1 });
    await callPut({ projectId: id, statsIncrements: { female: 20 }, tabId: OTHER_TAB, clientSeq: 1 });

    expect(fake.projects[0].stats.female).toBe(60);
  });

  it('the same save arriving twice (a retry whose first answer was lost) counts once', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const first = await callPut({ projectId: id, statsIncrements: { female: 3 }, tabId: TAB, clientSeq: 4 });
    const retry = await callPut({ projectId: id, statsIncrements: { female: 3 }, tabId: TAB, clientSeq: 4 });

    expect(await first.json()).toEqual({ success: true, modified: true });
    expect(await retry.json()).toEqual({ success: true, stale: true });
    expect(fake.projects[0].stats.female).toBe(13);
  });

  it('a count taken below zero by two devices goes back to zero', async () => {
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { ...eventDoc().stats, female: 1 } })] });
    mockRouteDependencies(fake, 'page-grant');

    await callPut({ projectId: id, statsIncrements: { female: -1 }, tabId: TAB, clientSeq: 1 });
    await callPut({ projectId: id, statsIncrements: { female: -1 }, tabId: OTHER_TAB, clientSeq: 1 });

    expect(fake.projects[0].stats.female).toBe(0);
  });

  it('counts on from a stored text number, and from nothing when the stat is missing', async () => {
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { ...eventDoc().stats, jersey: '7' } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, statsIncrements: { jersey: 2, scarf: 1 }, tabId: TAB, clientSeq: 1 });

    expect(res.status).toBe(200);
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(update.$set['stats.jersey']).toBe(9);
    expect(update.$inc).toEqual({ 'stats.scarf': 1 });
    expect(fake.projects[0].stats).toMatchObject({ jersey: 9, scarf: 1 });
  });

  it('can be sent with statsChanges for other keys; totals are derived from the counted values', async () => {
    const fake = makeFakeDb({ projects: [eventDoc({ stats: { remoteImages: 2, hostessImages: 1, selfies: 0 } })] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({
      projectId: id,
      statsChanges: { reportText1: 'hello' },
      statsIncrements: { selfies: 4 },
      tabId: TAB,
      clientSeq: 1,
    });

    expect(res.status).toBe(200);
    expect(fake.projects[0].stats).toMatchObject({ reportText1: 'hello', selfies: 4, allImages: 7 });
  });

  it.each([
    ['without tabId and clientSeq', { statsIncrements: { female: 1 } }],
    ['with a fraction', { statsIncrements: { female: 0.5 }, tabId: TAB, clientSeq: 1 }],
    ['over the size cap', { statsIncrements: { female: 1_000_001 }, tabId: TAB, clientSeq: 1 }],
    ['as text', { statsIncrements: { female: '1' }, tabId: TAB, clientSeq: 1 }],
    ['with a dotted key', { statsIncrements: { 'fanmass.peopleCount': 1 }, tabId: TAB, clientSeq: 1 }],
    ['for a key the save also sets', { statsChanges: { female: 5 }, statsIncrements: { female: 1 }, tabId: TAB, clientSeq: 1 }],
    ['for a key the save also removes', { statsRemoved: ['female'], statsIncrements: { female: 1 }, tabId: TAB, clientSeq: 1 }],
    ['not as an object', { statsIncrements: [1], tabId: TAB, clientSeq: 1 }],
  ])('rejects a count %s with 400 and writes nothing', async (_label, extra) => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id, ...extra });

    expect(res.status).toBe(400);
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
    expect(fake.projects[0]).toEqual(eventDoc());
  });
});

// ---------------------------------------------------------------------------
// Hashtag shape
// ---------------------------------------------------------------------------

describe('PUT /api/projects - hashtag lists are checked before anything is written', () => {
  it.each([
    ['a number in hashtags', { hashtags: [123] }],
    ['hashtags that are not a list', { hashtags: 'football' }],
    ['an empty hashtag', { hashtags: ['  '] }],
    ['a hashtag over 100 characters', { hashtags: ['x'.repeat(101)] }],
    ['more than 200 hashtags', { hashtags: Array.from({ length: 201 }, (_, i) => `tag${i}`) }],
    ['a category that is not a list', { categorizedHashtags: { x: 'not-an-array' } }],
    ['a number inside a category', { categorizedHashtags: { country: ['poland', 7] } }],
    ['categorizedHashtags as a list', { categorizedHashtags: [['poland']] }],
    ['a dotted category name', { categorizedHashtags: { 'a.b': ['x'] } }],
    ['a $ category name', { categorizedHashtags: { $where: ['x'] } }],
  ])('refuses %s with 400, for a grant holder and an admin, partial or legacy body', async (_label, hashtagFields) => {
    for (const via of ['page-grant', 'session'] as const) {
      for (const form of [{ statsChanges: { female: 11 } }, { stats: { ...eventDoc().stats, female: 11 } }]) {
        const fake = makeFakeDb({ projects: [eventDoc()], hashtags: [{ hashtag: 'football', count: 1 }] });
        mockRouteDependencies(fake, via);

        const res = await callPut({ projectId: id, ...form, ...hashtagFields });

        expect(res.status).toBe(400);
        expect((await res.json()).success).toBe(false);
        expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
        expect(fake.hashtagsCollection.updateOne).not.toHaveBeenCalled();
        expect(fake.projects[0]).toEqual(eventDoc());
        jest.resetModules();
      }
    }
  });

  it('still stores well-formed lists, a null that clears one, and a legacy category name', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'session');

    const res = await callPut({
      projectId: id,
      hashtags: null,
      categorizedHashtags: { country: ['poland'], 'Old Category': ['derby'] },
    });

    expect(res.status).toBe(200);
    expect(fake.projects[0].hashtags).toEqual([]);
    expect(fake.projects[0].categorizedHashtags).toEqual({ country: ['poland'], 'Old Category': ['derby'] });
  });
});

// ---------------------------------------------------------------------------
// Project id and roles
// ---------------------------------------------------------------------------

describe('PUT /api/projects - the project id and who may change admin fields', () => {
  it.each([
    ['an object wrapping the id', { id }],
    ['a 12-character string', 'x'.repeat(12)],
    ['a number', 12345],
    ['a missing id', undefined],
  ])('refuses %s with 400 and writes nothing', async (_label, projectId) => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'session');

    const res = await callPut({ projectId, statsChanges: { female: 7 } });

    expect(res.status).toBe(400);
    expect(fake.projectsCollection.updateOne).not.toHaveBeenCalled();
  });

  it('checks access and writes with the canonical lower-case id', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'page-grant');

    const res = await callPut({ projectId: id.toUpperCase(), statsChanges: { female: 7 } });

    expect(res.status).toBe(200);
    const guards = await import('@/lib/apiGuards');
    expect((guards.requireProjectWriteAccess as jest.Mock).mock.calls[0][1]).toBe(id);
    expect(fake.projects[0].stats.female).toBe(7);
  });

  it('a signed-in account below admin cannot change name, date, style, template or partners', async () => {
    const fake = makeFakeDb({ projects: [eventDoc()] });
    mockRouteDependencies(fake, 'member-session');

    const res = await callPut({
      projectId: id,
      statsChanges: { female: 11 },
      eventName: 'Renamed',
      eventDate: '2020-01-01',
      partner1Id: String(new ObjectId()),
      styleId: String(new ObjectId()),
    });

    expect(res.status).toBe(200);
    expect(fake.projects[0].eventName).toBe('PZPN x Bosnia and Herzegovina');
    expect(fake.projects[0].eventDate).toBe('2026-09-27');
    expect(fake.projects[0]).not.toHaveProperty('partner1Id');
    expect(fake.projects[0]).not.toHaveProperty('styleIdEnhanced');
    expect(fake.projects[0].stats.female).toBe(11);
  });
});
