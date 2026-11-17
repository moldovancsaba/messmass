import { ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';

export interface AiPartnerSummary {
  id: string;
  name: string;
  emoji?: string;
  viewSlug?: string;
  eventCount?: number;
}

export interface AiOrganizationSummary {
  id: string;
  name: string;
  slug?: string;
}

export interface AiPhotoEventRow {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  viewSlug: string | null;
  partners: AiPartnerSummary[];
  organization: AiOrganizationSummary | null;
  previewUrls: string[];
  sources?: string[];
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
export async function getAiPhotoEvents(limit = 500, source?: string): Promise<{
  events: AiPhotoEventRow[];
  total: number;
  totals: AiPhotoAnalyticsTotals;
  sourceCounts: { all: number; camera: number; local_storage: number };
  partners: AiPartnerSummary[];
  organizations: AiOrganizationSummary[];
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

  const matchFilter: Record<string, unknown> = {
    status: 'completed',
    tombstone: { $ne: true },
  };

  if (source === 'camera') {
    matchFilter.source = { $in: ['camera', null] };
  } else if (source === 'local_storage') {
    matchFilter.source = 'local_storage';
  }

  const [grouped, sourceAggregation] = await Promise.all([
    db.collection('fanmass_camera_photo_analyses').aggregate<{
      _id: string;
      sources: string[];
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
      { $match: matchFilter },
      {
        $group: {
          _id: '$eventId',
          sources: { $addToSet: { $ifNull: ['$source', 'camera'] } },
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
    ]).toArray(),
    db.collection('fanmass_camera_photo_analyses').aggregate<{
      _id: string | null;
      count: number;
    }>([
      { $match: { status: 'completed', tombstone: { $ne: true } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  let cameraCount = 0;
  let localStorageCount = 0;
  for (const row of sourceAggregation) {
    if (row._id === 'local_storage') {
      localStorageCount += finiteNumber(row.count);
    } else {
      cameraCount += finiteNumber(row.count);
    }
  }
  const sourceCounts = {
    all: cameraCount + localStorageCount,
    camera: cameraCount,
    local_storage: localStorageCount,
  };

  const eventIds = grouped.map((row) => String(row._id)).filter(ObjectId.isValid).map((id) => new ObjectId(id));
  const projectDocs = eventIds.length
    ? await db.collection('projects').find(
      { _id: { $in: eventIds } },
      { projection: { eventName: 1, eventDate: 1, viewSlug: 1, slug: 1, partner1Id: 1, partner2Id: 1, organizationId: 1 } },
    ).toArray()
    : [];
  const projects = new Map(projectDocs.map((doc) => [String(doc._id), doc]));

  const partnerIdSet = new Set<string>();
  const orgIdSet = new Set<string>();
  for (const doc of projectDocs) {
    for (const rawPid of [doc.partner1Id, doc.partner2Id]) {
      const pid = rawPid ? String(rawPid) : '';
      if (ObjectId.isValid(pid)) partnerIdSet.add(pid);
    }
    const oid = doc.organizationId ? String(doc.organizationId) : '';
    if (ObjectId.isValid(oid)) orgIdSet.add(oid);
  }

  const evidenceOrigins = grouped.map((row) => `camera-${String(row._id)}`);
  const [partnerDocs, orgDocs, evidenceSamples] = await Promise.all([
    partnerIdSet.size > 0
      ? db.collection('partners')
          .find({ _id: { $in: [...partnerIdSet].map((id) => new ObjectId(id)) } }, { projection: { name: 1, emoji: 1, viewSlug: 1, organizationId: 1 } })
          .toArray()
      : Promise.resolve([]),
    orgIdSet.size > 0
      ? db.collection('organizations')
          .find({ _id: { $in: [...orgIdSet].map((id) => new ObjectId(id)) } }, { projection: { name: 1, slug: 1, viewSlug: 1 } })
          .toArray()
      : Promise.resolve([]),
    evidenceOrigins.length > 0
      ? db.collection('fanmass_evidence')
          .find({ origin: { $in: evidenceOrigins }, 'review.status': { $nin: ['rejected', 'needs_investigation'] } }, { projection: { origin: 1, cropUrl: 1, photoUrl: 1 } })
          .limit(600)
          .toArray()
      : Promise.resolve([]),
  ]);

  const partnersMap = new Map<string, AiPartnerSummary>(
    partnerDocs.map((p: any) => [
      String(p._id),
      { id: String(p._id), name: String(p.name || ''), emoji: p.emoji ? String(p.emoji) : undefined, viewSlug: p.viewSlug ? String(p.viewSlug) : undefined },
    ]),
  );
  const orgsMap = new Map<string, AiOrganizationSummary>(
    orgDocs.map((o: any) => [
      String(o._id),
      { id: String(o._id), name: String(o.name || ''), slug: o.slug ? String(o.slug) : o.viewSlug ? String(o.viewSlug) : undefined },
    ]),
  );
  const previewsByEvent = new Map<string, string[]>();
  for (const ev of evidenceSamples as any[]) {
    const originStr = String(ev.origin || '');
    const eid = originStr.startsWith('camera-') ? originStr.slice(7) : '';
    const url = String(ev.cropUrl || ev.photoUrl || '').trim();
    if (!eid || !url) continue;
    const list = previewsByEvent.get(eid) ?? [];
    if (list.length < 3 && !list.includes(url)) {
      list.push(url);
      previewsByEvent.set(eid, list);
    }
  }

  const partnerDirectoryMap = new Map<string, AiPartnerSummary>();

  const events = grouped.map((row): AiPhotoEventRow => {
    const eventId = String(row._id);
    const project = projects.get(eventId) as any;
    const eventPartners: AiPartnerSummary[] = [];
    for (const rawPid of [project?.partner1Id, project?.partner2Id]) {
      const pid = rawPid ? String(rawPid) : '';
      const p = partnersMap.get(pid);
      if (p && !eventPartners.some((ep) => ep.id === p.id)) {
        eventPartners.push(p);
        const dirEntry = partnerDirectoryMap.get(p.id) ?? { ...p, eventCount: 0 };
        dirEntry.eventCount = (dirEntry.eventCount ?? 0) + 1;
        partnerDirectoryMap.set(p.id, dirEntry);
      }
    }
    const oid = project?.organizationId ? String(project.organizationId) : '';
    const org = orgsMap.get(oid) ?? null;

    return {
      eventId,
      eventName: String(project?.eventName || 'Unlinked Messmass event'),
      eventDate: project?.eventDate ? String(project.eventDate) : null,
      viewSlug: project?.viewSlug ? String(project.viewSlug) : project?.slug ? String(project.slug) : null,
      partners: eventPartners,
      organization: org,
      previewUrls: previewsByEvent.get(eventId) ?? [],
      sources: Array.isArray(row.sources) ? row.sources : undefined,
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

  return {
    events: events.slice(0, Math.min(Math.max(limit, 1), 500)),
    total: events.length,
    totals,
    sourceCounts,
    partners: [...partnerDirectoryMap.values()].sort((a, b) => (b.eventCount ?? 0) - (a.eventCount ?? 0) || a.name.localeCompare(b.name)),
    organizations: [...orgsMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}
