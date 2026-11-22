import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';
import { rebuildFanmassPhotoEventSummary } from './fanmassPhotoAnalyses';
import { driveSummaryPipeline, readDriveSummary } from './hashtagReport/measured';
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

export async function getAnalysisSummary(rawEventId: string): Promise<AiAnalysisSummaryDoc | null> {
  const eventId = String(rawEventId || '').trim();
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  let doc = await db.collection('ai_analysis_summaries').findOne(
    {
      eventId,
      sourceType: 'camera_photo_pipeline',
      contractVersion: 'messmass.camera-photo-results.v1',
    },
    { projection: { _id: 0 } },
  );

  // If no summary doc exists yet (or it says 0 photos) while completed photo rows exist, rebuild on demand
  const currentReceived = Number((doc?.summary as Record<string, unknown> | undefined)?.photoResultsReceived ?? 0);
  const photoColl = db.collection('fanmass_camera_photo_analyses');
  if ((!doc || currentReceived === 0) && typeof photoColl.countDocuments === 'function') {
    const rawCount = await photoColl.countDocuments({
      eventId,
      tombstone: { $ne: true },
      status: 'completed',
    });
    if (rawCount > 0) {
      await rebuildFanmassPhotoEventSummary(eventId, { allowMissingProject: true });
      doc = await db.collection('ai_analysis_summaries').findOne(
        {
          eventId,
          sourceType: 'camera_photo_pipeline',
          contractVersion: 'messmass.camera-photo-results.v1',
        },
        { projection: { _id: 0 } },
      );
    }
  }

  // Also check if this event has placed Drive photos in fanmass_event_drive_photos
  const driveColl = db.collection('fanmass_event_drive_photos');
  const [driveFacet] = typeof driveColl.aggregate === 'function'
    ? await driveColl.aggregate(driveSummaryPipeline({ eventId })).toArray()
    : [];
  const { drive } = readDriveSummary(driveFacet);

  if (!doc && drive.photos === 0) return null;

  // Merge drive photo analytics into the summary when drive photos exist for this event
  let combinedSummary: Record<string, unknown> = doc?.summary
    ? { ...(doc.summary as Record<string, unknown>) }
    : {
        contractVersion: 'messmass.camera-photo-results.v1',
        messmassEventId: eventId,
        lastAnalyzedAt: null,
        photoResultsReceived: 0,
        optInPhotos: 0,
        personBoxes: 0,
        faceBoxes: 0,
        peopleCounts: { measured: 0 },
        genderProjection: {},
        ageProjection: {},
        emotionProjection: {},
        accessoryProjection: {},
        merchandiseCounts: {},
        brandMentions: [],
        clubMentions: [],
        brandAppearanceTypes: {},
        moderationPhotosReviewed: 0,
        moderationFlaggedPhotos: 0,
        moderationSeverityCounts: {},
        prohibitedContentCounts: {},
      };

  if (drive.photos > 0) {
    const addCounts = (a: unknown, b: Record<string, number>): Record<string, number> => {
      const out: Record<string, number> = { ...((a && typeof a === 'object' ? (a as Record<string, number>) : {})) };
      for (const [k, v] of Object.entries(b || {})) {
        if (typeof v === 'number' && v > 0) out[k] = (out[k] || 0) + v;
      }
      return out;
    };
    const mergeMentions = (
      a: unknown,
      b: Array<{ name: string; count: number }>,
    ): Array<{ name: string; count: number }> => {
      const map = new Map<string, { name: string; count: number }>();
      for (const item of Array.isArray(a) ? a : []) {
        if (item && typeof item.name === 'string' && typeof item.count === 'number' && item.count > 0) {
          map.set(item.name.toLowerCase(), { name: item.name, count: item.count });
        }
      }
      for (const item of b || []) {
        if (item.name && item.count > 0) {
          const key = item.name.toLowerCase();
          const prev = map.get(key);
          if (prev) prev.count += item.count;
          else map.set(key, { name: item.name, count: item.count });
        }
      }
      return [...map.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
    };

    const prevPeople = Number(((combinedSummary.peopleCounts as Record<string, unknown> | undefined)?.measured) ?? 0);
    combinedSummary = {
      ...combinedSummary,
      photoResultsReceived: Number(combinedSummary.photoResultsReceived ?? 0) + drive.analysed,
      optInPhotos: Number(combinedSummary.optInPhotos ?? 0) + drive.withOptIn,
      peopleCounts: { measured: prevPeople + drive.people },
      genderProjection: addCounts(combinedSummary.genderProjection, drive.genders),
      ageProjection: addCounts(combinedSummary.ageProjection, drive.ageGroups),
      emotionProjection: addCounts(combinedSummary.emotionProjection, drive.emotions),
      brandMentions: mergeMentions(combinedSummary.brandMentions, drive.brands),
      clubMentions: mergeMentions(combinedSummary.clubMentions, drive.clubs),
    };
  }

  const project = await db.collection('projects').findOne(
    { _id: new ObjectId(eventId) },
    { projection: { externalRefs: 1 } },
  );
  const externalRefs = (project?.externalRefs as Record<string, unknown> | undefined) || {};
  const camera = (externalRefs.camera as Record<string, unknown> | undefined) || {};
  const cameraEventId = typeof camera.eventId === 'string' ? camera.eventId : null;
  const cameraMongoId = typeof camera.mongoId === 'string' ? camera.mongoId : null;
  const target = cameraMongoId || cameraEventId;
  const baseUrl = (config.cameraBaseUrl || 'https://camera.messmass.com').replace(/\/$/, '');
  const analysisUrl = target ? `${baseUrl}/admin/events/${target}/analysis` : null;

  return {
    eventId,
    batchId: 'camera-photo-results',
    sourceType: 'camera_photo_pipeline',
    contractVersion: 'messmass.camera-photo-results.v1',
    receivedAt: typeof doc?.receivedAt === 'string' ? doc.receivedAt : new Date().toISOString(),
    summary: combinedSummary,
    cameraEvent: {
      eventId: cameraEventId,
      mongoId: cameraMongoId,
      analysisUrl,
    },
  };
}
