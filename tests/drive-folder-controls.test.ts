// tests/drive-folder-controls.test.ts
// WHAT: Unit coverage for the pause / resume / check-now controls added to
//     drive_folder_links — the one hand-rolled invariant each depends on.
// WHY: fanmass has no reachable address of its own; these controls only work by
//     being a field the next poll notices. Two rules make that safe rather than
//     silently stuck: a status push always clears syncRequestedAt (otherwise a
//     request that raced a poll would sit "pending" forever even though it was
//     served), and a paused folder can never pick up a new request (otherwise
//     "check now" would appear to work once on a folder fanmass has been told
//     to ignore, then quietly stop).
// HOW: A minimal in-memory fake of just the two Mongo operations these
//     functions issue (findOneAndUpdate with $set/$unset, find().toArray()) —
//     not a general Mongo emulator, only enough to observe these invariants
//     without touching a real database.

jest.mock('@/lib/mongodb', () => {
  const { ObjectId } = require('mongodb');
  const docs: Record<string, any>[] = [];

  function matches(doc: any, filter: any): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && !(value instanceof ObjectId)) {
        const ops = value as Record<string, unknown>;
        return Object.entries(ops).every(([op, operand]) => {
          if (op === '$ne') return doc[key] !== operand;
          if (op === '$exists') return (doc[key] !== undefined) === operand;
          throw new Error(`unsupported operator in test fake: ${op}`);
        });
      }
      if (key === '_id') return String(doc._id) === String(value);
      return doc[key] === value;
    });
  }

  const fakeCollection = {
    __docs: docs,
    async findOneAndUpdate(filter: any, update: any) {
      const doc = docs.find((d) => matches(d, filter));
      if (!doc) return null;
      Object.assign(doc, update.$set || {});
      for (const key of Object.keys(update.$unset || {})) delete doc[key];
      return doc;
    },
    async findOne(filter: any) {
      return docs.find((d) => matches(d, filter)) || null;
    },
    find(filter: any) {
      const rows = docs.filter((d) => matches(d, filter));
      return { toArray: async () => rows };
    },
  };

  return {
    __esModule: true,
    default: Promise.resolve({ db: () => ({ collection: () => fakeCollection }) }),
    __fakeCollection: fakeCollection,
  };
});

import { ObjectId } from 'mongodb';
import {
  setDriveFolderStatus,
  setDriveFolderPaused,
  requestDriveFolderSync,
  listPendingSyncFolderIds,
} from '@/lib/driveFolders';

const { __fakeCollection: fake } = jest.requireMock('@/lib/mongodb') as { __fakeCollection: any };

function seed(doc: Partial<Record<string, any>>) {
  const base = {
    _id: new ObjectId(),
    eventId: new ObjectId().toString(),
    folderId: `fld_${Math.random().toString(36).slice(2, 8)}`,
    folderUrl: 'https://drive.google.com/drive/folders/x',
    status: 'pending',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    ...doc,
  };
  fake.__docs.push(base);
  return base;
}

beforeEach(() => {
  fake.__docs.length = 0;
});

describe('setDriveFolderStatus', () => {
  it('clears a pending sync request on any status push', async () => {
    const link = seed({ syncRequestedAt: '2026-08-15T10:00:00.000Z' });
    const updated = await setDriveFolderStatus(link.eventId, link.folderId, 'analyzing');
    expect(updated.syncRequestedAt).toBeUndefined();
  });

  it('still clears the request on an error push, alongside setting lastError', async () => {
    const link = seed({ syncRequestedAt: '2026-08-15T10:00:00.000Z' });
    const updated = await setDriveFolderStatus(link.eventId, link.folderId, 'error', '[Errno 11] Resource deadlock avoided');
    expect(updated.syncRequestedAt).toBeUndefined();
    expect(updated.lastError).toBe('[Errno 11] Resource deadlock avoided');
  });
});

describe('requestDriveFolderSync', () => {
  it('sets syncRequestedAt on an active folder', async () => {
    const link = seed({});
    const updated = await requestDriveFolderSync(link.eventId, String(link._id));
    expect(typeof updated.syncRequestedAt).toBe('string');
  });

  it('rejects a paused folder rather than silently queuing a request fanmass will never see', async () => {
    const link = seed({ paused: true });
    await expect(requestDriveFolderSync(link.eventId, String(link._id))).rejects.toMatchObject({
      code: 'DRIVE_FOLDER_PAUSED',
    });
  });
});

describe('setDriveFolderPaused', () => {
  it('pausing does not by itself request a sync', async () => {
    const link = seed({});
    const updated = await setDriveFolderPaused(link.eventId, String(link._id), true);
    expect(updated.paused).toBe(true);
    expect(updated.syncRequestedAt).toBeUndefined();
  });
});

describe('listPendingSyncFolderIds', () => {
  it('excludes paused folders even if a request is somehow still set', async () => {
    seed({ folderId: 'active_with_request', syncRequestedAt: '2026-08-15T10:00:00.000Z' });
    seed({ folderId: 'paused_with_request', paused: true, syncRequestedAt: '2026-08-15T10:00:00.000Z' });
    seed({ folderId: 'active_no_request' });
    const ids = await listPendingSyncFolderIds();
    expect(ids).toEqual(['active_with_request']);
  });
});
