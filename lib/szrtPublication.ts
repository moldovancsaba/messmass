// Switch the SZRT report's audience, brand and club sections on or off. The sections show only while
// `publishApproved` is true on the szrt_progress document (see isVisionPublishable). The switch is written here
// and nowhere else: the figures routes never touch it. Every change records who approved it and when.

import { invalidateReportSnapshot } from './reportSnapshotManager';
import { SZRT_PROGRESS_COLLECTION, SZRT_PROGRESS_ID } from './szrtVisionProgress';

/** Every report scope that shows the SZRT vision sections. A cached report is dropped so the change shows at once. */
export const SZRT_REPORT_SCOPES = [
  { scopeType: 'hashtag', scopeIdentifier: 'tippmixreport2026' },
  { scopeType: 'hashtag', scopeIdentifier: 'szrt' },
  { scopeType: 'hashtag', scopeIdentifier: 'szerencsejatek' },
  { scopeType: 'partner', scopeIdentifier: 'szrt' },
  { scopeType: 'partner', scopeIdentifier: 'tippmixreport2026' },
] as const;

type Collection = {
  findOne: (filter: unknown) => Promise<Record<string, unknown> | null>;
  updateOne: (filter: unknown, update: unknown) => Promise<unknown>;
};
export type PublicationDb = { collection: (name: string) => Collection };
type Invalidate = (query: { scopeType: 'hashtag' | 'partner'; scopeIdentifier: string }) => Promise<void>;

function fail(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

export async function setSzrtPublication(
  db: PublicationDb,
  input: unknown,
  options: { invalidate?: Invalidate; now?: () => string } = {},
): Promise<{ publishApproved: boolean; publishApprovedBy: string; publishApprovedAt: string; processedCount: number | null; invalidatedScopes: number }> {
  const body = input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
  if (!body || typeof body.approved !== 'boolean') fail(400, 'INVALID_SZRT_PUBLICATION', 'approved (true or false) is required.');
  const approvedBy = typeof body.approvedBy === 'string' ? body.approvedBy.trim().slice(0, 80) : '';
  if (!approvedBy) fail(400, 'INVALID_SZRT_PUBLICATION', 'approvedBy is required: say who decided.');
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  const collection = db.collection(SZRT_PROGRESS_COLLECTION);
  const doc = await collection.findOne({ _id: SZRT_PROGRESS_ID });
  // Never switch on what the deep rerun did not measure: the old worker's figures must not become visible by accident.
  if (body.approved && !(doc && typeof doc.pipeline === 'string' && doc.pipeline && doc.receivedAt)) {
    fail(409, 'NO_FIGURES_DELIVERED', 'Figures from the deep rerun must be delivered before the report is published.');
  }
  const publishApprovedAt = (options.now ?? (() => new Date().toISOString()))();
  await collection.updateOne(
    { _id: SZRT_PROGRESS_ID },
    { $set: { publishApproved: body.approved, publishApprovedAt, publishApprovedBy: approvedBy, publishApprovalNote: note } },
  );

  const invalidate = options.invalidate ?? invalidateReportSnapshot;
  let invalidatedScopes = 0;
  for (const scope of SZRT_REPORT_SCOPES) {
    try {
      await invalidate(scope);
      invalidatedScopes += 1;
    } catch {
      // A cache that could not be dropped expires on its own within the hour; the switch itself is stored.
    }
  }
  return {
    publishApproved: body.approved, publishApprovedBy: approvedBy, publishApprovedAt,
    processedCount: typeof doc?.processedCount === 'number' ? doc.processedCount : null, invalidatedScopes,
  };
}
