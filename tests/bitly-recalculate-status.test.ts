// tests/bitly-recalculate-status.test.ts
// WHAT: GET /api/bitly/recalculate counts the referenced projects with a $group aggregation, never distinct(), and reports
//     the orphaned associations and the deleted projects they point at.
// WHY: The Mongo client runs the strict Stable API v1, which has no distinct command (drift register entry 68); the fake
//     collection below throws on distinct() the way the strict client does.

import { ObjectId } from 'mongodb';

const living = new ObjectId();
const deleted = new ObjectId();

type Row = Record<string, unknown>;
const data: Record<string, Row[]> = {
  bitly_links: [{ _id: new ObjectId(), lastSyncAt: new Date() }],
  bitly_project_links: [{ projectId: living }, { projectId: living }, { projectId: deleted }, { bitlyLinkId: 'no-project' }],
  projects: [{ _id: living }],
};

const same = (a: unknown, b: unknown) => String(a) === String(b);
// Only the filter shapes the route uses: {}, { _id: { $in } } and { projectId: { $nin } }.
const matches = (row: Row, filter: Record<string, Record<string, unknown[]>> = {}) =>
  Object.entries(filter).every(([field, cond]) => {
    if ('$in' in cond) return cond.$in.some((v) => same(v, row[field]));
    if ('$nin' in cond) return !cond.$nin.some((v) => same(v, row[field]));
    return true;
  });

const cursor = (rows: Row[]) => {
  const c = { sort: () => c, limit: () => c, project: () => c, toArray: async () => rows };
  return c;
};

jest.mock('@/lib/apiGuards', () => ({ __esModule: true, requireSession: async () => null }));
jest.mock('@/lib/bitly-recalculator', () => ({ __esModule: true }));
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) => ({
      countDocuments: async (filter?: Record<string, Record<string, unknown[]>>) =>
        data[name].filter((row) => matches(row, filter)).length,
      find: (filter?: Record<string, Record<string, unknown[]>>) =>
        cursor(name === 'bitly_links' ? data[name] : data[name].filter((row) => matches(row, filter))),
      aggregate: (pipeline: Array<Record<string, unknown>>) => {
        expect(pipeline).toEqual([{ $match: { projectId: { $exists: true } } }, { $group: { _id: '$projectId' } }]);
        const ids = new Map<string, unknown>();
        for (const row of data[name]) if ('projectId' in row) ids.set(String(row.projectId), row.projectId);
        return cursor([...ids.values()].map((_id) => ({ _id })));
      },
      distinct: () => {
        throw new Error('APIStrictError: distinct is not in API Version 1');
      },
    }),
  }),
  default: async () => ({}),
}));

import { GET } from '@/app/api/bitly/recalculate/route';
import { NextRequest } from 'next/server';

test('the status counts referenced projects without distinct() and reports orphans and deleted projects', async () => {
  const res = await GET(new NextRequest('http://localhost/api/bitly/recalculate'));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.links).toBe(1);
  expect(body.associations).toBe(4);
  expect(body.deletedProjectsReferenced).toBe(1);
  // The row that points at the deleted project and the row without a projectId are both outside the living set.
  expect(body.orphanedAssociations).toBe(2);
  expect(body.isStale).toBe(false);
});
