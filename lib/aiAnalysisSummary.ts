import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';

/** A Messmass-derived event roll-up over durable single-photo result rows. */
export interface AiAnalysisSummaryDoc {
  eventId: string;
  batchId: 'camera-photo-results';
  sourceType: 'camera_photo_pipeline';
  contractVersion: 'messmass.camera-photo-results.v1';
  receivedAt: string;
  summary: Record<string, unknown>;
}

export async function getAnalysisSummary(eventId: string): Promise<AiAnalysisSummaryDoc | null> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  const doc = await db.collection('ai_analysis_summaries').findOne(
    { eventId, sourceType: 'camera_photo_pipeline', contractVersion: 'messmass.camera-photo-results.v1' },
    { projection: { _id: 0 } },
  );
  return (doc as unknown as AiAnalysisSummaryDoc | null) ?? null;
}
