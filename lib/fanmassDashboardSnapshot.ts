// lib/fanmassDashboardSnapshot.ts
// WHAT: Storage for the dashboard-snapshot pushed by fanmass on its
//     messmass_push_minutes cadence — Executive, Analytics, Run Control, and
//     Entity Curation data, one document per (eventId, batchId) pair.
// WHY: Push, not pull — this is fanmass-initiated, one-way delivery on a
//     timer. There is no ack contract (contrast lib/aiRescan.ts's
//     poll/apply/ack pair): a dropped or superseded snapshot is replaced by
//     the next scheduled push, not lost, because it represents current
//     state, not a one-time command.
// HOW: Full-document upsert per push (most-recent-wins), keyed on
//     (eventId, batchId). Section contents are opaque to this module — it
//     validates top-level shape only, not fanmass's internal field names,
//     so fanmass's read models can evolve without a coordinated schema
//     migration here.

import { getDb } from './fanmassIntegration';

export const DASHBOARD_SNAPSHOT_CONTRACT = 'fanmass.messmass.dashboard-snapshot.v1';

export interface FanmassDashboardSnapshotDoc {
  eventId: string;
  batchId: string;
  batchName: string | null;
  contractVersion: string;
  generatedAt: string;
  receivedAt: string;
  correlationId?: string;
  sections: {
    executive?: Record<string, unknown>;
    analytics?: Record<string, unknown>;
    runControl?: Record<string, unknown>;
    entityCuration?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
}

function invalid(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

function nowIso(): string {
  return new Date().toISOString();
}

const SECTION_KEYS = ['executive', 'analytics', 'runControl', 'entityCuration', 'settings'] as const;

export async function ensureDashboardSnapshotIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection('fanmass_dashboard_snapshot').createIndex({ eventId: 1, batchId: 1 }, { unique: true });
  await db.collection('fanmass_dashboard_snapshot').createIndex({ eventId: 1 });
}

// WHAT: Validate and store a pushed dashboard snapshot, replacing any
//     previous one for the same (eventId, batchId) pair.
// WHY: Full replace (not per-section $set) matches the fire-and-forget push
//     design on fanmass's side — each push carries a complete snapshot, so a
//     partial section is fanmass's own bug to fix, not something this
//     endpoint should try to merge around.
export async function storeDashboardSnapshot(
  body: Record<string, unknown>
): Promise<{ eventId: string; batchId: string; receivedAt: string }> {
  const contractVersion = String(body?.contractVersion || '');
  if (!contractVersion) {
    invalid(400, 'INVALID_SNAPSHOT', 'contractVersion is required.');
  }
  if (contractVersion !== DASHBOARD_SNAPSHOT_CONTRACT) {
    invalid(409, 'CONTRACT_MISMATCH', `Unsupported contract version: ${contractVersion}`);
  }

  const eventId = String(body?.messmassEventId || '').trim();
  if (!eventId) {
    invalid(400, 'INVALID_SNAPSHOT', 'messmassEventId is required.');
  }
  const batchId = String(body?.batchId || '').trim();
  if (!batchId) {
    invalid(400, 'INVALID_SNAPSHOT', 'batchId is required.');
  }

  const sections: Record<string, unknown> = {};
  for (const key of SECTION_KEYS) {
    if (body[key] !== undefined) {
      sections[key] = body[key];
    }
  }
  if (Object.keys(sections).length === 0) {
    invalid(400, 'INVALID_SNAPSHOT', 'Snapshot carries no recognized section (executive/analytics/runControl/entityCuration/settings).');
  }

  const receivedAt = nowIso();
  const db = await getDb();
  await ensureDashboardSnapshotIndexes();
  await db.collection('fanmass_dashboard_snapshot').updateOne(
    { eventId, batchId },
    {
      $set: {
        eventId,
        batchId,
        batchName: typeof body.batchName === 'string' ? body.batchName : null,
        contractVersion,
        generatedAt: typeof body.generatedAt === 'string' ? body.generatedAt : receivedAt,
        receivedAt,
        correlationId: typeof body.correlationId === 'string' ? body.correlationId : undefined,
        sections,
      },
    },
    { upsert: true }
  );

  return { eventId, batchId, receivedAt };
}

// WHAT: Latest dashboard snapshot for a messmass event, across all connected
//     batches (usually one, per the primary/additive connection model).
// WHY: The new admin tabs read by eventId, not batchId — an operator is
//     looking at "this event's fanmass data," not a specific batch id.
export async function getLatestDashboardSnapshot(eventId: string): Promise<FanmassDashboardSnapshotDoc | null> {
  const db = await getDb();
  const doc = await db
    .collection('fanmass_dashboard_snapshot')
    .find({ eventId }, { projection: { _id: 0 } })
    .sort({ receivedAt: -1 })
    .limit(1)
    .next();
  return (doc as unknown as FanmassDashboardSnapshotDoc | null) ?? null;
}

// WHAT: Every event with at least one dashboard snapshot on record, newest
//     first — the source list for the admin tab's event picker. Carries
//     imageCount (sections.runControl.progress.uploadedImages) so the picker
//     can default-hide events with nothing to show yet, the same "Show
//     events without images" pattern AiAnalyticsView.tsx already uses.
export async function listSnapshotEvents(): Promise<
  Array<{ eventId: string; batchName: string | null; receivedAt: string; imageCount: number }>
> {
  const db = await getDb();
  const docs = await db
    .collection('fanmass_dashboard_snapshot')
    .aggregate([
      { $sort: { receivedAt: -1 } },
      {
        $group: {
          _id: '$eventId',
          batchName: { $first: '$batchName' },
          receivedAt: { $first: '$receivedAt' },
          imageCount: { $first: '$sections.runControl.progress.uploadedImages' },
        },
      },
      { $sort: { receivedAt: -1 } },
      { $limit: 200 },
    ])
    .toArray();
  return docs.map((doc) => ({
    eventId: String(doc._id),
    batchName: typeof doc.batchName === 'string' ? doc.batchName : null,
    receivedAt: String(doc.receivedAt || ''),
    imageCount: typeof doc.imageCount === 'number' ? doc.imageCount : 0,
  }));
}
