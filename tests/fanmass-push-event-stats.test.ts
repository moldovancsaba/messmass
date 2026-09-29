// tests/fanmass-push-event-stats.test.ts
// WHAT: pushEventStats (fanmass analysis pushes during live events) writes
//     only the values it pushes and the totals they change, each as its own
//     `stats.<name>` path.
// WHY: It used to read the event's stats, look up the derived variables, and
//     write the whole stats object back. An event editor save landing between
//     that read and that write -- an operator's taps, a report text -- was put
//     back to the older value while the editor showed it as saved; the
//     editor's next re-fetch then took the reverted value and counted on from
//     it.
// HOW: The real function against an in-memory stand-in for MongoDB that
//     applies dotted $set paths, with a hook that lands an editor save between
//     the function's read and its write. No real cluster (.env.local points at
//     production).

import { ObjectId } from 'mongodb';

type Doc = Record<string, any>;

function setPath(doc: Doc, path: string, value: unknown) {
  const keys = path.split('.');
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (target[key] === undefined) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

function fakeDb(project: Doc, derived: string[] = []) {
  const projects = [project];
  let beforeWrite: (() => void) | null = null;
  const projectsCollection = {
    findOne: jest.fn(async (filter: Doc) => {
      const found = projects.find((p) => String(p._id) === String(filter._id));
      return found ? JSON.parse(JSON.stringify({ ...found, _id: undefined })) : null;
    }),
    updateOne: jest.fn(async (filter: Doc, update: Doc) => {
      if (beforeWrite) {
        const hook = beforeWrite;
        beforeWrite = null;
        hook();
      }
      const target = projects.find((p) => String(p._id) === String(filter._id));
      if (!target) return { matchedCount: 0 };
      for (const [path, value] of Object.entries(update.$set || {})) setPath(target, path, value);
      return { matchedCount: 1 };
    }),
  };
  const db = {
    collection: (name: string) => {
      if (name === 'projects') return projectsCollection;
      if (name === 'variables_metadata') {
        return { find: () => ({ toArray: async () => derived.map((n) => ({ name: n })) }) };
      }
      throw new Error(`Unexpected collection ${name}`);
    },
  };
  return {
    db,
    projects,
    projectsCollection,
    onNextWrite: (hook: () => void) => {
      beforeWrite = hook;
    },
  };
}

async function load(fake: ReturnType<typeof fakeDb>) {
  jest.doMock('@/lib/fanmassIntegration', () => ({ __esModule: true, getDb: jest.fn(async () => fake.db) }));
  jest.doMock('@/lib/v3/syncEngine', () => ({ __esModule: true, syncPartnerToV3Entity: jest.fn() }));
  jest.doMock('@/lib/slugUtils', () => ({ __esModule: true, generateProjectSlugs: jest.fn() }));
  jest.doMock('@/lib/partnerIdentifier', () => ({ __esModule: true, generateUniquePartnerViewSlug: jest.fn() }));
  return import('@/lib/fanmassMapping');
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('pushEventStats', () => {
  const eventId = new ObjectId();

  it('an editor save landing between its read and its write survives the push', async () => {
    const fake = fakeDb({
      _id: eventId,
      stats: { female: 211, reportText1: 'draft', remoteImages: 1, hostessImages: 0, selfies: 0, allImages: 1, totalFans: 0 },
    });
    const { pushEventStats } = await load(fake);
    fake.onNextWrite(() => {
      // The operator's next tap and a report text, saved field-level by
      // PUT /api/projects while the push was running.
      fake.projects[0].stats.female = 212;
      fake.projects[0].stats.reportText1 = 'final text';
    });

    const result = await pushEventStats(String(eventId), { fanmassGenderMalePct: 55, fanmassDemographicsAnalyzed: 400 });

    expect(result.applied).toEqual(['fanmassGenderMalePct', 'fanmassDemographicsAnalyzed']);
    const update = fake.projectsCollection.updateOne.mock.calls[0][1];
    expect(update.$set).not.toHaveProperty('stats');
    expect(update.$set).toMatchObject({ 'stats.fanmassGenderMalePct': 55, 'stats.fanmassDemographicsAnalyzed': 400 });
    expect(update.$set).toHaveProperty('aiLastAnalyzedAt');
    expect(fake.projects[0].stats).toMatchObject({
      female: 212,
      reportText1: 'final text',
      fanmassGenderMalePct: 55,
      fanmassDemographicsAnalyzed: 400,
    });
  });

  it('writes a derived total only when the push changes it', async () => {
    const fake = fakeDb({ _id: eventId, stats: { remoteImages: 2, hostessImages: 1, selfies: 0, allImages: 3, totalFans: 0 } });
    const { pushEventStats } = await load(fake);

    await pushEventStats(String(eventId), { selfies: 4 });

    const set = fake.projectsCollection.updateOne.mock.calls[0][1].$set;
    expect(set).toMatchObject({ 'stats.selfies': 4, 'stats.allImages': 7 });
    expect(set).not.toHaveProperty('stats.totalFans');
  });

  it('skips derived variables and names that cannot be a stats field path', async () => {
    const fake = fakeDb({ _id: eventId, stats: { female: 1 } }, ['totalGender']);
    const { pushEventStats } = await load(fake);

    const result = await pushEventStats(String(eventId), { totalGender: 9, 'fanmass.fans': 3, $bad: 1, fanmassFans: 3 });

    expect(result.applied).toEqual(['fanmassFans']);
    const set = fake.projectsCollection.updateOne.mock.calls[0][1].$set;
    expect(Object.keys(set).filter((k) => k.startsWith('stats.')).sort()).toEqual(['stats.allImages', 'stats.fanmassFans', 'stats.totalFans']);
  });

  it('sets the whole stats field on an old event whose stats is null', async () => {
    const fake = fakeDb({ _id: eventId, stats: null });
    const { pushEventStats } = await load(fake);

    await pushEventStats(String(eventId), { fanmassFans: 3 });

    const set = fake.projectsCollection.updateOne.mock.calls[0][1].$set;
    expect(set.stats).toMatchObject({ fanmassFans: 3 });
    expect(fake.projects[0].stats).toMatchObject({ fanmassFans: 3 });
  });
});
