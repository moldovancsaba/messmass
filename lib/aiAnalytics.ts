import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';

export interface AiPhotoEventRow {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  photoResultsReceived: number;
  peopleDetections: number;
  personBoxes: number;
  faceBoxes: number;
  brandAppearances: number;
  clubAppearances: number;
  merchandiseDetections: number;
  moderationPhotosReviewed: number;
  moderationFlaggedPhotos: number;
  lastAnalyzedAt: string | null;
}

export interface AiPhotoAnalyticsTotals {
  eventsWithResults: number;
  photoResultsReceived: number;
  peopleDetections: number;
  personBoxes: number;
  faceBoxes: number;
  brandAppearances: number;
  clubAppearances: number;
  merchandiseDetections: number;
  moderationPhotosReviewed: number;
  moderationFlaggedPhotos: number;
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * Read only completed, non-tombstoned photo results. These are facts about
 * results Messmass received, not a claim that every eligible Camera photo has
 * been processed. Camera owns that denominator and event completion status.
 */
export async function getAiPhotoEvents(limit = 500): Promise<{
  events: AiPhotoEventRow[];
  total: number;
  totals: AiPhotoAnalyticsTotals;
}> {
  const db = await getDb();
  const toNumber = (input: unknown) => ({
    $convert: { input, to: 'double', onError: 0, onNull: 0 },
  });
  const safeArray = (input: string) => ({ $cond: [{ $isArray: input }, input, []] });
  const sumNamedCounts = (input: string) => ({
    $reduce: {
      input: safeArray(input),
      initialValue: 0,
      in: { $add: ['$$value', toNumber('$$this.count')] },
    },
  });
  const merchandiseObject = {
    $cond: [
      { $eq: [{ $type: '$summary.merchandiseCounts' }, 'object'] },
      '$summary.merchandiseCounts',
      {},
    ],
  };
  const merchandiseSum = {
    $reduce: {
      input: { $objectToArray: merchandiseObject },
      initialValue: 0,
      in: { $add: ['$$value', toNumber('$$this.v')] },
    },
  };

  const grouped = await db.collection('fanmass_camera_photo_analyses').aggregate<{
    _id: string;
    photoResultsReceived: number;
    peopleDetections: number;
    personBoxes: number;
    faceBoxes: number;
    brandAppearances: number;
    clubAppearances: number;
    merchandiseDetections: number;
    moderationPhotosReviewed: number;
    moderationFlaggedPhotos: number;
    lastAnalyzedAt: string | null;
  }>([
    { $match: { status: 'completed', tombstone: { $ne: true } } },
    {
      $group: {
        _id: '$eventId',
        photoResultsReceived: { $sum: 1 },
        peopleDetections: { $sum: toNumber('$summary.peopleCounts.measured') },
        personBoxes: { $sum: { $size: safeArray('$boxes.people') } },
        faceBoxes: { $sum: { $size: safeArray('$boxes.faces') } },
        brandAppearances: { $sum: sumNamedCounts('$summary.brandMentions') },
        clubAppearances: { $sum: sumNamedCounts('$summary.clubMentions') },
        merchandiseDetections: { $sum: merchandiseSum },
        moderationPhotosReviewed: { $sum: { $cond: [{ $eq: ['$summary.moderation.status', 'completed'] }, 1, 0] } },
        moderationFlaggedPhotos: { $sum: { $cond: [{ $and: [
          { $eq: ['$summary.moderation.status', 'completed'] },
          { $eq: ['$summary.moderation.flagged', true] },
        ] }, 1, 0] } },
        lastAnalyzedAt: { $max: '$analyzedAt' },
      },
    },
  ]).toArray();

  const eventIds = grouped.map((row) => String(row._id)).filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const projectDocs = eventIds.length
    ? await db.collection('projects').find(
      { _id: { $in: eventIds } },
      { projection: { eventName: 1, eventDate: 1 } },
    ).toArray()
    : [];
  const projects = new Map(projectDocs.map((doc) => [String(doc._id), doc]));

  const events = grouped.map((row): AiPhotoEventRow => {
    const eventId = String(row._id);
    const project = projects.get(eventId);
    return {
      eventId,
      eventName: String(project?.eventName || 'Unlinked Messmass event'),
      eventDate: project?.eventDate ? String(project.eventDate) : null,
      photoResultsReceived: finiteNumber(row.photoResultsReceived),
      peopleDetections: finiteNumber(row.peopleDetections),
      personBoxes: finiteNumber(row.personBoxes),
      faceBoxes: finiteNumber(row.faceBoxes),
      brandAppearances: finiteNumber(row.brandAppearances),
      clubAppearances: finiteNumber(row.clubAppearances),
      merchandiseDetections: finiteNumber(row.merchandiseDetections),
      moderationPhotosReviewed: finiteNumber(row.moderationPhotosReviewed),
      moderationFlaggedPhotos: finiteNumber(row.moderationFlaggedPhotos),
      lastAnalyzedAt: typeof row.lastAnalyzedAt === 'string' ? row.lastAnalyzedAt : null,
    };
  }).sort((a, b) => (b.lastAnalyzedAt || '').localeCompare(a.lastAnalyzedAt || ''));

  const totals = events.reduce<AiPhotoAnalyticsTotals>((sum, event) => ({
    eventsWithResults: sum.eventsWithResults + 1,
    photoResultsReceived: sum.photoResultsReceived + event.photoResultsReceived,
    peopleDetections: sum.peopleDetections + event.peopleDetections,
    personBoxes: sum.personBoxes + event.personBoxes,
    faceBoxes: sum.faceBoxes + event.faceBoxes,
    brandAppearances: sum.brandAppearances + event.brandAppearances,
    clubAppearances: sum.clubAppearances + event.clubAppearances,
    merchandiseDetections: sum.merchandiseDetections + event.merchandiseDetections,
    moderationPhotosReviewed: sum.moderationPhotosReviewed + event.moderationPhotosReviewed,
    moderationFlaggedPhotos: sum.moderationFlaggedPhotos + event.moderationFlaggedPhotos,
  }), {
    eventsWithResults: 0,
    photoResultsReceived: 0,
    peopleDetections: 0,
    personBoxes: 0,
    faceBoxes: 0,
    brandAppearances: 0,
    clubAppearances: 0,
    merchandiseDetections: 0,
    moderationPhotosReviewed: 0,
    moderationFlaggedPhotos: 0,
  });

  return { events: events.slice(0, Math.min(Math.max(limit, 1), 500)), total: events.length, totals };
}
