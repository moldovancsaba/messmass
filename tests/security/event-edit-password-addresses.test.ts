// tests/security/event-edit-password-addresses.test.ts
// WHAT: An event editor has one `edit` password, whichever of its two
//     addresses (editSlug, _id) it was set on: creating or regenerating it
//     deletes the row on the other address, removing it removes every row,
//     and Share reports the editor protected when either address has one.
// WHY: validatePagePassword accepts the newest `edit` password across both
//     addresses, and the editor gate treats a password on either as
//     protecting the editor -- but create, regenerate, remove and the Share
//     status each looked at one address. A legacy password left on the _id
//     was retired by a regenerate on the editSlug, then came back into force
//     (with write access) when the admin removed the current password, while
//     Share called the editor unprotected and offered no way to remove it.
// HOW: The real lib/pagePassword and lib/pageAccess against an in-memory
//     page_passwords/projects stand-in. No network, no real cluster.

import { ObjectId } from 'mongodb';

type Doc = Record<string, any>;

const EDIT_SLUG = '2f1c7a4e-8b3d-4c5e-9f6a-1b2c3d4e5f60';
const START = Date.parse('2026-09-27T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;

function matches(row: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (condition && typeof condition === 'object' && '$in' in condition) return condition.$in.includes(row[key]);
    return String(row[key]) === String(condition);
  });
}

function world(project: Doc) {
  const rows: Doc[] = [];
  const passwords = {
    findOne: jest.fn(async (filter: Doc) => rows.find((r) => matches(r, filter)) ?? null),
    updateOne: jest.fn(async (filter: Doc, update: Doc, options?: { upsert?: boolean }) => {
      const found = rows.find((r) => matches(r, filter));
      if (!found && !options?.upsert) return { matchedCount: 0 };
      const row: Doc = found ?? { _id: new ObjectId(), ...filter, ...(update.$setOnInsert || {}) };
      if (!found) rows.push(row);
      Object.assign(row, update.$set || {});
      for (const key of Object.keys(update.$unset || {})) delete row[key];
      for (const [key, amount] of Object.entries(update.$inc || {})) row[key] = (row[key] || 0) + (amount as number);
      return { matchedCount: 1 };
    }),
    deleteMany: jest.fn(async (filter: Doc) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], filter)) rows.splice(i, 1);
      return { deletedCount: before - rows.length };
    }),
  };
  const projects = {
    findOne: jest.fn(async (filter: Doc) =>
      (filter._id ? String(project._id) === String(filter._id) : project.editSlug === filter.editSlug) ? project : null
    ),
  };
  const db = {
    collection: (name: string) => {
      if (name === 'page_passwords') return passwords;
      if (name === 'projects') return projects;
      throw new Error(`Unexpected collection ${name}`);
    },
  };
  jest.doMock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => db }) }));
  jest.doMock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'messmass-test' } }));
  jest.doMock('@/lib/fanmassIntegration', () => ({ __esModule: true, getDb: jest.fn(async () => db) }));
  jest.doMock('next/headers', () => ({ __esModule: true, cookies: jest.fn(async () => ({ get: () => undefined })) }));
  jest.doMock('@/lib/auth', () => ({ __esModule: true, getAdminUser: jest.fn(async () => null) }));
  return { rows, passwords };
}

let nowMs = START;

beforeEach(() => {
  nowMs = START;
  jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
});

describe('event edit password: one password across the editor\'s addresses', () => {
  it('regenerate, then remove: the retired password stays refused and the editor is unprotected', async () => {
    const project = { _id: new ObjectId(), editSlug: EDIT_SLUG };
    const id = String(project._id);
    const { rows } = world(project);
    const lib = await import('@/lib/pagePassword');
    const { requirePageAccessDecision } = await import('@/lib/pageAccess');

    // A legacy event: P_old was shared on the _id address.
    const old = await lib.getOrCreatePagePassword(id, 'edit');
    expect(old.password).toMatch(/^[0-9a-f]{32}$/);
    expect(await lib.validatePagePassword(EDIT_SLUG, 'edit', old.password)).toBe(true);

    // The admin regenerates from Share, which keys edit shares by editSlug.
    nowMs = START + HOUR_MS;
    const current = await lib.getOrCreatePagePassword(EDIT_SLUG, 'edit', true);
    expect(rows.map((r) => r.pageId)).toEqual([EDIT_SLUG]);
    for (const address of [EDIT_SLUG, id]) {
      expect(await lib.validatePagePassword(address, 'edit', old.password)).toBe(false);
      expect(await lib.validatePagePassword(address, 'edit', current.password)).toBe(true);
    }

    // Later the admin removes the password in Share (DELETE ?pageId=<editSlug>).
    nowMs = START + 2 * HOUR_MS;
    expect(await lib.removePagePassword(EDIT_SLUG, 'edit')).toBe(true);
    expect(rows).toEqual([]);
    for (const address of [EDIT_SLUG, id]) {
      expect(await lib.validatePagePassword(address, 'edit', old.password)).toBe(false);
      expect(await lib.validatePagePassword(address, 'edit', current.password)).toBe(false);
      expect((await lib.getShareableLinkStatus(address, 'edit')).isProtected).toBe(false);
    }
    expect(await requirePageAccessDecision('edit', [EDIT_SLUG, EDIT_SLUG, id])).toEqual({ allowed: true, via: 'unprotected' });
  });

  it('removing at either address removes the rows on both (left over from before this rule)', async () => {
    const project = { _id: new ObjectId(), editSlug: EDIT_SLUG };
    const id = String(project._id);
    const { rows } = world(project);
    rows.push(
      { pageId: id, pageType: 'edit', passwordHash: 'x', createdAt: new Date(START - HOUR_MS).toISOString() },
      { pageId: EDIT_SLUG, pageType: 'edit', passwordHash: 'y', createdAt: new Date(START).toISOString() },
      { pageId: EDIT_SLUG, pageType: 'event-report', passwordHash: 'z', createdAt: new Date(START).toISOString() }
    );
    const lib = await import('@/lib/pagePassword');

    await lib.removePagePassword(EDIT_SLUG, 'edit');

    expect(rows.map((r) => `${r.pageType}:${r.pageId}`)).toEqual([`event-report:${EDIT_SLUG}`]);
  });

  it('Share reports the editor protected by a password on its other address', async () => {
    const project = { _id: new ObjectId(), editSlug: EDIT_SLUG };
    const id = String(project._id);
    const { rows } = world(project);
    rows.push({ pageId: id, pageType: 'edit', passwordHash: 'x', createdAt: new Date(START).toISOString() });
    const lib = await import('@/lib/pagePassword');

    const status = await lib.getShareableLinkStatus(EDIT_SLUG, 'edit', 'https://www.messmass.com');
    expect(status).toEqual({ url: `https://www.messmass.com/edit/${EDIT_SLUG}`, isProtected: true });
    expect((await lib.getShareableLinkStatus(id, 'edit')).isProtected).toBe(true);
  });

  it('creating a password on one address deletes the one on the other', async () => {
    const project = { _id: new ObjectId(), editSlug: EDIT_SLUG };
    const id = String(project._id);
    const { rows } = world(project);
    const lib = await import('@/lib/pagePassword');

    const onSlug = await lib.getOrCreatePagePassword(EDIT_SLUG, 'edit');
    nowMs = START + HOUR_MS;
    const onId = await lib.getOrCreatePagePassword(id, 'edit');

    expect(rows.map((r) => r.pageId)).toEqual([id]);
    expect(await lib.validatePagePassword(EDIT_SLUG, 'edit', onSlug.password)).toBe(false);
    expect(await lib.validatePagePassword(EDIT_SLUG, 'edit', onId.password)).toBe(true);
  });

  it('other page types keep their rows per address', async () => {
    const project = { _id: new ObjectId(), editSlug: EDIT_SLUG };
    const id = String(project._id);
    const { rows } = world(project);
    const lib = await import('@/lib/pagePassword');

    await lib.getOrCreatePagePassword(id, 'event-report');
    await lib.getOrCreatePagePassword(EDIT_SLUG, 'event-report');
    expect(rows.map((r) => r.pageId).sort()).toEqual([EDIT_SLUG, id].sort());

    await lib.removePagePassword(EDIT_SLUG, 'event-report');
    expect(rows.map((r) => r.pageId)).toEqual([id]);
  });
});
