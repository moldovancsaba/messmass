// lib/fanmassCommands.ts
// WHAT: Generic operator-command queue for actions Messmass needs Fanmass to
//      apply — run control (start/stop batch), entity curation
//      (rename/merge/reclassify/reject), and settings write-back.
// WHY: Generalizes the proven "flag the next poll notices" pattern already
//      used by ai_rescan_requests (lib/aiRescan.ts) from a single
//      rescan-specific flag into a typed, appendable, multi-pending-command
//      queue — one collection instead of a new bespoke flag collection per
//      new action type.
// HOW: Same poll-target shape as ai_rescan_requests (fanmass polls messmass,
//      never the other way around — fanmass has no reachable address of its
//      own), but a real departure on ack: a hard delete (clearRescanRequest's
//      approach) would destroy ackResult the instant it existed, and some
//      command outcomes (e.g. settings.update's restart-required flag) live
//      nowhere else. Ack here transitions status -> 'applied' with ackResult
//      attached, retained until a TTL index sweeps it — messmass keeps the
//      result long enough to be useful, the collection still self-cleans.

import { Db } from 'mongodb';
import { randomUUID } from 'crypto';
import { getDb } from './fanmassIntegration';

export type FanmassCommandType =
  | 'run_control.start_batch'
  | 'run_control.stop_batch'
  | 'entity.confirm_cluster'
  | 'entity.reject_cluster'
  | 'entity.rename'
  | 'entity.merge'
  | 'settings.update'
  | 'settings.rotateApiKey';

export type FanmassCommandStatus = 'pending' | 'applied';

export interface FanmassCommand {
  commandId: string;
  type: FanmassCommandType;
  payload: Record<string, unknown>;
  status: FanmassCommandStatus;
  requestedAt: string;
  requestedBy: string;
  appliedAt?: string;
  ackResult?: Record<string, unknown>;
}

const TTL_SECONDS_APPLIED = 86400; // 24h — long enough for an operator to notice, short enough to self-clean.

function nowIso(): string {
  return new Date().toISOString();
}

function toFanmassCommand(doc: any): FanmassCommand {
  return {
    commandId: String(doc.commandId),
    type: doc.type,
    payload: doc.payload || {},
    status: doc.status,
    requestedAt: doc.requestedAt,
    requestedBy: String(doc.requestedBy || ''),
    appliedAt: doc.appliedAt ?? undefined,
    ackResult: doc.ackResult ?? undefined,
  };
}

async function ensureCommandIndexes(db: Db): Promise<void> {
  await db.collection('fanmass_commands').createIndex({ commandId: 1 }, { unique: true });
  await db.collection('fanmass_commands').createIndex({ status: 1, requestedAt: 1 });
  await db.collection('fanmass_commands').createIndex(
    { appliedAt: 1 },
    { expireAfterSeconds: TTL_SECONDS_APPLIED, partialFilterExpression: { status: 'applied' } }
  );
}

// WHAT: Enqueue a new command. Internal-only — no HTTP route calls this
//      directly; app/api/admin/fanmass/commands/route.ts (admin-session
//      auth) is the sole caller, and validates type/payload before calling.
// WHY internal-only, deliberately: this module has no way to enforce
//      "only an authenticated admin may enqueue" on its own — that boundary
//      belongs to the caller, same separation as requestRescan() vs. its
//      admin-gated trigger route.
export async function createCommand(
  type: FanmassCommandType,
  payload: Record<string, unknown>,
  requestedBy: string
): Promise<FanmassCommand> {
  const db = await getDb();
  await ensureCommandIndexes(db);
  const doc: FanmassCommand = {
    commandId: randomUUID(),
    type,
    payload,
    status: 'pending',
    requestedAt: nowIso(),
    requestedBy,
  };
  await db.collection('fanmass_commands').insertOne(doc as any);
  return doc;
}

// WHAT: Every pending command, for fanmass's poll — ordered oldest-first so
//      apply order is deterministic (unlike listPendingRescanRequests, which
//      needs no ordering since at most one document exists per event).
export async function listPendingCommands(): Promise<FanmassCommand[]> {
  const db = await getDb();
  await ensureCommandIndexes(db);
  const docs = await db
    .collection('fanmass_commands')
    .find({ status: 'pending' })
    .sort({ requestedAt: 1 })
    .toArray();
  return docs.map(toFanmassCommand);
}

// WHAT: Every pending command whose type+payload key overlap with a
//      candidate, for double-submit dedupe at the enqueue boundary.
export async function findPendingDuplicate(
  type: FanmassCommandType,
  payload: Record<string, unknown>
): Promise<FanmassCommand | null> {
  const db = await getDb();
  await ensureCommandIndexes(db);
  const pending = await db.collection('fanmass_commands').find({ status: 'pending', type }).toArray();
  if (pending.length === 0) return null;
  // For settings.update, only conflict on overlapping keys — two unrelated
  // field changes queued together are fine. For every other type, any
  // pending command of the same type is a duplicate (there is only ever one
  // meaningful in-flight command per type today: one active batch, one
  // curation action per click).
  if (type === 'settings.update') {
    const incomingKeys = new Set(Object.keys(payload));
    const match = pending.find((doc) => Object.keys(doc.payload || {}).some((k) => incomingKeys.has(k)));
    return match ? toFanmassCommand(match) : null;
  }
  return toFanmassCommand(pending[0]);
}

// WHAT: Called by fanmass once a command has actually been applied.
//      Idempotent: acking an already-applied command returns the originally
//      stored ackResult rather than raising or overwriting it, so a retried
//      DELETE after a dropped response is always safe.
// WHY status: 'applied' + TTL, not deleteOne — see module header.
export async function ackCommand(
  commandId: string,
  ackResult?: Record<string, unknown>
): Promise<{ applied: true; commandId: string; ackResult?: Record<string, unknown> }> {
  const db = await getDb();
  await ensureCommandIndexes(db);
  const existing = await db.collection('fanmass_commands').findOne({ commandId });
  if (!existing) {
    throw Object.assign(new Error('Fanmass command was not found.'), { status: 404, code: 'COMMAND_NOT_FOUND' });
  }
  if (existing.status === 'applied') {
    return { applied: true, commandId, ackResult: existing.ackResult };
  }
  const appliedAt = nowIso();
  await db.collection('fanmass_commands').updateOne(
    { commandId },
    { $set: { status: 'applied', appliedAt, ...(ackResult !== undefined ? { ackResult } : {}) } }
  );
  return { applied: true, commandId, ackResult };
}
