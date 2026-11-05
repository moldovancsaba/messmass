import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';
import config from './config';

/** A Messmass-derived event roll-up over durable single-photo result rows. */
export interface AiAnalysisSummaryDoc {
  eventId: string;
  batchId: 'camera-photo-results';
  sourceType: 'camera_photo_pipeline';
  contractVersion: 'messmass.camera-photo-results.v1';
  receivedAt: string;
  summary: Record<string, unknown>;
  cameraEvent?: {
    eventId: string | null;
    mongoId: string | null;
    analysisUrl: string | null;
  };
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
  if (!doc) return null;

  const project = ObjectId.isValid(eventId)
    ? await db.collection('projects').findOne(
        { _id: new ObjectId(eventId) },
        { projection: { externalRefs: 1 } },
      )
    : null;
  const externalRefs = (project?.externalRefs as Record<string, unknown> | undefined) || {};
  const camera = (externalRefs.camera as Record<string, unknown> | undefined) || {};
  const cameraEventId = typeof camera.eventId === 'string' ? camera.eventId : null;
  const cameraMongoId = typeof camera.mongoId === 'string' ? camera.mongoId : null;
  const target = cameraMongoId || cameraEventId;
  const baseUrl = (config.cameraBaseUrl || 'https://camera.messmass.com').replace(/\/$/, '');
  const analysisUrl = target ? `${baseUrl}/admin/events/${target}/analysis` : null;

  return {
    ...(doc as unknown as AiAnalysisSummaryDoc),
    cameraEvent: {
      eventId: cameraEventId,
      mongoId: cameraMongoId,
      analysisUrl,
    },
  };
}
