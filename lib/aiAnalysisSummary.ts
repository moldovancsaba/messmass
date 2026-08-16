// lib/aiAnalysisSummary.ts
// WHAT: Storage for the full per-event AI analysis summary pushed by fanmass.
// WHY: Only flat scalar variables crossed the integration boundary, so everything
//     list-shaped — brand mentions, club mentions, demographic projections — was
//     discarded at transfer. Verified on the live UEFA batch: fanmass computes 20
//     brand mentions and 20 club mentions per event, and none of it could reach a
//     messmass surface. This module stores the whole contract document so the AI
//     event report can render it.
// HOW: One document per event in `ai_analysis_summaries`, latest wins. A document,
//     not stats keys — stats names are chart variables with registration
//     semantics, and twenty brand rows are not twenty variables. That still
//     holds for brand/club NAMES (see lib/aiDemographicStats.ts's own WHY):
//     what changed is that gender/age/emotion are a closed, fixed category
//     set, unlike brand names, so THOSE — plus smiling% and brand/club
//     COUNTS — are also derived into real stats variables on every store,
//     rather than living only in this document where no report can reach them.

import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';
import { pushEventStats } from './fanmassMapping';
import { deriveFanmassDemographicStats } from './aiDemographicStats';

// WHAT: The contract family this store accepts.
// WHY: Major-version gate. A same-major producer may add fields (stored as-is);
//     a different major means the shape itself changed and silent storage would
//     hand the report undefined behaviour.
export const SUMMARY_CONTRACT_PREFIX = 'fanmass.messmass.analytics-summary.v1';

// WHAT: Upper bound on a stored summary document.
// WHY: The lists are producer-controlled; without a guard a runaway producer
//     could grow documents without limit. 1MB is ~50x the observed real size.
export const MAX_SUMMARY_BYTES = 1_000_000;

export interface AiAnalysisSummaryDoc {
  eventId: string;
  batchId: string;
  contractVersion: string;
  receivedAt: string;         // server-assigned on receipt, never producer-supplied
  generatedAt: string | null; // producer's own stamp, informational only
  summary: Record<string, unknown>;
}

function invalid(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

function nowIso(): string {
  return new Date().toISOString();
}

// WHAT: Validate and store a pushed summary, replacing any previous one.
// WHY: Latest-wins is the correct semantic — the summary is a snapshot of the
//     batch's current analysis, not an event log.
export async function storeAnalysisSummary(
  eventId: string,
  body: Record<string, unknown>
): Promise<{ eventId: string; receivedAt: string }> {
  if (!ObjectId.isValid(eventId)) {
    invalid(422, 'INVALID_EVENT_ID', 'Invalid event id.');
  }
  const contractVersion = String(body?.contractVersion || '');
  if (!contractVersion) {
    invalid(400, 'INVALID_SUMMARY', 'contractVersion is required.');
  }
  if (!contractVersion.startsWith(SUMMARY_CONTRACT_PREFIX)) {
    invalid(409, 'CONTRACT_MISMATCH', `Unsupported contract version: ${contractVersion}`);
  }

  // The contract wraps the analysis fields at the top level; everything except
  // the envelope fields IS the summary. Unknown fields ride along untouched so a
  // newer same-major producer never loses data here.
  const { contractVersion: _v, messmassEventId: _e, batchId, generatedAt, ...summary } = body;
  if (Object.keys(summary).length === 0) {
    invalid(400, 'INVALID_SUMMARY', 'Summary carries no analysis fields.');
  }

  const size = Buffer.byteLength(JSON.stringify(body), 'utf8');
  if (size > MAX_SUMMARY_BYTES) {
    invalid(413, 'SUMMARY_TOO_LARGE', `Summary is ${size} bytes; limit is ${MAX_SUMMARY_BYTES}.`);
  }

  const db = await getDb();
  const event = await db
    .collection('projects')
    .findOne({ _id: new ObjectId(eventId) }, { projection: { _id: 1 } });
  if (!event) {
    invalid(404, 'EVENT_NOT_FOUND', 'Event was not found.');
  }

  const receivedAt = nowIso();
  // Whole-document $set, deliberately not a $set/$setOnInsert split: a path
  // conflict between those operators broke this integration's variable upsert
  // once already.
  await db.collection('ai_analysis_summaries').updateOne(
    { eventId },
    {
      $set: {
        eventId,
        batchId: String(batchId || ''),
        contractVersion,
        receivedAt,
        generatedAt: typeof generatedAt === 'string' ? generatedAt : null,
        summary,
      },
    },
    { upsert: true }
  );

  // Best-effort: a report-variable derivation failing must never fail the
  // summary push itself — fanmass has no retry path for this half of the
  // write, and the summary document (the source of truth) already landed.
  const derived = deriveFanmassDemographicStats(summary);
  if (Object.keys(derived).length > 0) {
    try {
      await pushEventStats(eventId, derived);
    } catch {
      // Next push retries this; the summary document above is unaffected.
    }
  }

  return { eventId, receivedAt };
}

export async function getAnalysisSummary(eventId: string): Promise<AiAnalysisSummaryDoc | null> {
  if (!ObjectId.isValid(eventId)) {
    invalid(422, 'INVALID_EVENT_ID', 'Invalid event id.');
  }
  const db = await getDb();
  const doc = await db.collection('ai_analysis_summaries').findOne({ eventId }, { projection: { _id: 0 } });
  return (doc as unknown as AiAnalysisSummaryDoc | null) ?? null;
}
