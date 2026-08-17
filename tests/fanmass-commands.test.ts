// tests/fanmass-commands.test.ts
// WHAT: Unit coverage for the generic command queue's core invariants:
//     list-pending only ever returns pending commands in requestedAt order,
//     ack is idempotent (a retried DELETE never overwrites a stored
//     ackResult), acking an unknown id is a 404 rather than a silent no-op,
//     and duplicate-detection distinguishes overlapping vs. unrelated
//     settings.update payloads.
// HOW: A minimal in-memory fake of the handful of Mongo operations this
//     module issues — insertOne, find().sort().toArray(), findOne,
//     updateOne, createIndex (no-op) — not a general Mongo emulator.

jest.mock('@/lib/mongodb', () => {
  const docs: Record<string, any>[] = [];

  function matches(doc: any, filter: any): boolean {
    return Object.entries(filter).every(([key, value]) => doc[key] === value);
  }

  const fakeCollection = {
    __docs: docs,
    async createIndex() {
      return 'noop_index';
    },
    async insertOne(doc: any) {
      docs.push({ ...doc });
      return { insertedId: doc.commandId };
    },
    async findOne(filter: any) {
      return docs.find((d) => matches(d, filter)) || null;
    },
    find(filter: any) {
      let rows = docs.filter((d) => matches(d, filter));
      return {
        sort(spec: Record<string, number>) {
          const [key, dir] = Object.entries(spec)[0];
          rows = [...rows].sort((a, b) => (a[key] > b[key] ? 1 : -1) * dir);
          return this;
        },
        async toArray() {
          return rows;
        },
      };
    },
    async updateOne(filter: any, update: any) {
      const doc = docs.find((d) => matches(d, filter));
      if (doc) Object.assign(doc, update.$set || {});
      return { matchedCount: doc ? 1 : 0 };
    },
  };

  return {
    __esModule: true,
    default: Promise.resolve({ db: () => ({ collection: () => fakeCollection }) }),
    __fakeCollection: fakeCollection,
  };
});

import {
  createCommand,
  listPendingCommands,
  ackCommand,
  findPendingDuplicate,
} from '@/lib/fanmassCommands';

describe('fanmassCommands', () => {
  it('lists only pending commands, ordered oldest-first', async () => {
    const first = await createCommand('run_control.start_batch', { batchId: 'b1' }, 'admin@messmass');
    await new Promise((r) => setTimeout(r, 2));
    const second = await createCommand('entity.rename', { entityId: 'e1', newName: 'X' }, 'admin@messmass');

    const pending = await listPendingCommands();
    expect(pending.map((c) => c.commandId)).toEqual([first.commandId, second.commandId]);
    expect(pending.every((c) => c.status === 'pending')).toBe(true);
  });

  it('acks a pending command, removing it from the pending list and storing ackResult', async () => {
    const cmd = await createCommand('settings.update', { yolo_confidence: 0.5 }, 'admin@messmass');
    const result = await ackCommand(cmd.commandId, { restartRequired: true });
    expect(result).toEqual({ applied: true, commandId: cmd.commandId, ackResult: { restartRequired: true } });

    const pending = await listPendingCommands();
    expect(pending.find((c) => c.commandId === cmd.commandId)).toBeUndefined();
  });

  it('is idempotent: acking an already-applied command returns the original ackResult, not a new one', async () => {
    const cmd = await createCommand('settings.rotateApiKey', {}, 'admin@messmass');
    await ackCommand(cmd.commandId, { rotated: true });
    const second = await ackCommand(cmd.commandId, { rotated: false });
    expect(second.ackResult).toEqual({ rotated: true });
  });

  it('throws COMMAND_NOT_FOUND for an unknown commandId', async () => {
    await expect(ackCommand('does-not-exist')).rejects.toMatchObject({ code: 'COMMAND_NOT_FOUND', status: 404 });
  });

  it('detects a duplicate pending command of the same non-settings type', async () => {
    await createCommand('run_control.start_batch', { batchId: 'b2' }, 'admin@messmass');
    const dup = await findPendingDuplicate('run_control.start_batch', { batchId: 'b2' });
    expect(dup).not.toBeNull();
  });

  it('detects a settings.update duplicate only on overlapping keys, not unrelated ones', async () => {
    await createCommand('settings.update', { yolo_confidence: 0.7 }, 'admin@messmass');
    const overlapping = await findPendingDuplicate('settings.update', { yolo_confidence: 0.9 });
    expect(overlapping).not.toBeNull();
    const unrelated = await findPendingDuplicate('settings.update', { camera_backfill: true });
    expect(unrelated).toBeNull();
  });
});
