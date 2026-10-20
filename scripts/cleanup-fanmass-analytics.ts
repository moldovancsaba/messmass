import { ObjectId, type Document } from 'mongodb';
import clientPromise from '../lib/mongodb';
import { ensureFanmassAnalyticsVariables, FANMASS_PHOTO_VARIABLE_NAMES } from '../lib/fanmassAnalyticsVariables';
import { PHOTO_ANALYSIS_COLLECTION, rebuildFanmassPhotoEventSummary } from '../lib/fanmassPhotoAnalyses';
import { getDb } from '../lib/fanmassIntegration';

const APPLY = process.argv.includes('--apply');
const ARCHIVE = 'fanmass_analytics_archive';
const EXPECTED_HOST = 'messmass-cluster.r96vlxs.mongodb.net';
const EXPECTED_DATABASE = 'messmass';

type SourceDocument = Document & { _id: unknown };

function idText(value: unknown): string {
  return value && typeof value === 'object' && 'toHexString' in value
    ? String((value as { toHexString(): string }).toHexString())
    : String(value);
}

function plainObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function archiveDocuments(
  db: Awaited<ReturnType<typeof getDb>>,
  sourceCollection: string,
  rows: SourceDocument[],
  reason: string,
): Promise<void> {
  if (!rows.length) return;
  const archive = db.collection(ARCHIVE);
  const archivedAt = new Date().toISOString();
  for (let start = 0; start < rows.length; start += 100) {
    const chunk = rows.slice(start, start + 100);
    await archive.bulkWrite(chunk.map((document) => {
      const sourceId = idText(document._id);
      return {
        updateOne: {
          filter: { _id: `${sourceCollection}:${sourceId}` },
          update: {
            $setOnInsert: {
              sourceCollection,
              sourceId,
              archivedAt,
              reason,
              document,
            },
          },
          upsert: true,
        },
      };
    }), { ordered: false });
  }
  const ids = rows.map((row) => idText(row._id));
  const archivedCount = await archive.countDocuments({ sourceCollection, sourceId: { $in: ids } });
  if (archivedCount !== rows.length) {
    throw new Error(`Archive verification failed for ${sourceCollection}: expected ${rows.length}, found ${archivedCount}.`);
  }
}

async function main() {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) throw new Error('MONGODB_URI is required. Load the intended Messmass environment first.');
  const host = new URL(rawUri).hostname;
  const db = await getDb();
  if (host !== EXPECTED_HOST || db.databaseName !== EXPECTED_DATABASE) {
    throw new Error(`Refusing cleanup against ${host}/${db.databaseName}; expected the configured Messmass production database.`);
  }

  const summaries = db.collection<SourceDocument>('ai_analysis_summaries');
  const summaryRows = await summaries.find({}).toArray();
  const snapshotCollection = db.collection<SourceDocument>('fanmass_dashboard_snapshot');
  const snapshotRows = await snapshotCollection.find({}).toArray();
  const eventLinkCollection = db.collection<SourceDocument>('fanmass_event_links');
  const eventLinkRows = await eventLinkCollection.find({}).toArray();
  const rescanCollection = db.collection<SourceDocument>('ai_rescan_requests');
  const rescanRows = await rescanCollection.find({}).toArray();
  const photoCollection = db.collection<SourceDocument>(PHOTO_ANALYSIS_COLLECTION);
  const activePhotoRows = await photoCollection.find(
    { status: 'completed', tombstone: { $ne: true } },
    { projection: { eventId: 1, cameraPartnerId: 1, cameraEventId: 1, cameraPhotoId: 1, boxes: 1 } },
  ).toArray();
  const activePhotos = activePhotoRows.length;
  const eventIds = [...new Set(activePhotoRows.map((row) => String(row.eventId || '')))];
  const invalidPhotoEventIds = eventIds.filter((id) => !/^[a-f0-9]{24}$/i.test(id)).length;
  let photoRecordsWithMissingRoutingIds = 0;
  let photoRecordsWithMissingBoxArrays = 0;
  let photoEventLinkMismatches = 0;
  let photoPartnerLinkMismatches = 0;
  const projectsById = new Map<string, Record<string, unknown> | null>();
  const partnersByLink = new Map<string, boolean>();
  for (const photo of activePhotoRows) {
    const eventId = String(photo.eventId || '');
    const cameraPartnerId = String(photo.cameraPartnerId || '');
    const cameraEventId = String(photo.cameraEventId || '');
    if (!cameraPartnerId || !cameraEventId || !photo.cameraPhotoId) photoRecordsWithMissingRoutingIds++;
    const boxes = plainObject(photo.boxes) || {};
    if (!Array.isArray(boxes.people) || !Array.isArray(boxes.faces)) photoRecordsWithMissingBoxArrays++;
    if (!/^[a-f0-9]{24}$/i.test(eventId)) continue;

    if (!projectsById.has(eventId)) {
      const project = await db.collection('projects').findOne(
        { _id: new ObjectId(eventId) },
        { projection: { externalRefs: 1, partnerId: 1, partner1Id: 1, partner2Id: 1, partnerIds: 1 } },
      );
      projectsById.set(eventId, project as Record<string, unknown> | null);
    }
    const project = projectsById.get(eventId);
    const externalRefs = plainObject(project?.externalRefs) || {};
    const cameraLink = plainObject(externalRefs.camera) || {};
    if (!project || cameraLink.eventId !== cameraEventId) photoEventLinkMismatches++;

    const rawPartnerIds = [project?.partnerId, project?.partner1Id, project?.partner2Id,
      ...(Array.isArray(project?.partnerIds) ? project.partnerIds : [])];
    const partnerIds = rawPartnerIds
      .map((value) => value instanceof ObjectId ? value : (typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null))
      .filter((value): value is ObjectId => value !== null);
    const partnerKey = `${eventId}\n${cameraPartnerId}`;
    if (!partnersByLink.has(partnerKey)) {
      const linkedPartner = partnerIds.length
        ? await db.collection('partners').findOne({ _id: { $in: partnerIds }, cameraPartnerId }, { projection: { _id: 1 } })
        : null;
      partnersByLink.set(partnerKey, Boolean(linkedPartner));
    }
    if (!partnersByLink.get(partnerKey)) photoPartnerLinkMismatches++;
  }

  const projectRows = await db.collection<SourceDocument>('projects')
    .find({}, { projection: { stats: 1, aiLastAnalyzedAt: 1, fanmassPhotoResultReceivedAt: 1 } })
    .toArray();
  const projectsToClean = projectRows.flatMap((project) => {
    const stats = plainObject(project.stats) || {};
    const obsoleteStats = Object.fromEntries(Object.entries(stats).filter(([key]) => key.startsWith('fanmass')));
    return Object.keys(obsoleteStats).length || project.aiLastAnalyzedAt || project.fanmassPhotoResultReceivedAt
      ? [{ project, obsoleteStats }]
      : [];
  });

  const variableCollection = db.collection<SourceDocument>('variables_metadata');
  const variableRows = await variableCollection.find({ name: /^fanmass/ }).toArray();
  const summaryCounts = await summaries.aggregate([
    { $group: { _id: { sourceType: '$sourceType', contractVersion: '$contractVersion' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  const plan = {
    mode: APPLY ? 'apply' : 'dry-run',
    host,
    database: db.databaseName,
    obsoleteSummaryDocumentsToArchive: summaryRows.length,
    obsoleteFanmassDashboardSnapshotsToArchive: snapshotRows.length,
    obsoleteFanmassEventBatchLinksToArchive: eventLinkRows.length,
    obsoleteEventWideRescanRequestsToArchive: rescanRows.length,
    activePhotoResultsToKeep: activePhotos,
    eventsToRebuild: eventIds.length,
    invalidPhotoEventIds,
    photoRecordsWithMissingRoutingIds,
    photoRecordsWithMissingBoxArrays,
    photoEventLinkMismatches,
    photoPartnerLinkMismatches,
    projectsWithLegacyFanmassStatsToClean: projectsToClean.length,
    obsoleteFanmassVariableDefinitionsToReplace: variableRows.length,
    canonicalVariableDefinitions: FANMASS_PHOTO_VARIABLE_NAMES.size,
    existingSummaryVersions: summaryCounts,
  };
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  if (invalidPhotoEventIds || photoRecordsWithMissingRoutingIds || photoRecordsWithMissingBoxArrays
    || photoEventLinkMismatches || photoPartnerLinkMismatches) {
    throw new Error('Active photo results do not all have complete, exact event and partner links; no cleanup was applied.');
  }
  if (!APPLY) return;

  await db.collection(ARCHIVE).createIndex({ sourceCollection: 1, sourceId: 1 }, { unique: true, name: 'fanmass_archive_source_unique' });
  await archiveDocuments(db, 'ai_analysis_summaries', summaryRows, 'Replaced by mechanically rebuilt one-photo results.');
  await archiveDocuments(db, 'fanmass_dashboard_snapshot', snapshotRows, 'Retired event-level Fanmass dashboards; Messmass reports are derived from one-photo results.');
  await archiveDocuments(db, 'fanmass_event_links', eventLinkRows, 'Retired Fanmass event-batch links; Camera and Messmass use exact linked event IDs.');
  await archiveDocuments(db, 'ai_rescan_requests', rescanRows, 'Retired event-wide Fanmass rescans; Fanmass processes eligible Camera photos one at a time.');
  if (summaryRows.length) {
    await summaries.deleteMany({ _id: { $in: summaryRows.map((row) => row._id) } });
  }
  if (snapshotRows.length) {
    await snapshotCollection.deleteMany({ _id: { $in: snapshotRows.map((row) => row._id) } });
  }
  if (eventLinkRows.length) {
    await eventLinkCollection.deleteMany({ _id: { $in: eventLinkRows.map((row) => row._id) } });
  }
  if (rescanRows.length) {
    await rescanCollection.deleteMany({ _id: { $in: rescanRows.map((row) => row._id) } });
  }

  const projectArchive = db.collection(ARCHIVE);
  for (const { project, obsoleteStats } of projectsToClean) {
    const archiveId = idText(project._id);
    await projectArchive.updateOne(
      { _id: `projects.stats:${archiveId}` },
      {
        $setOnInsert: {
          sourceCollection: 'projects.stats',
          sourceId: archiveId,
          archivedAt: new Date().toISOString(),
          reason: 'Removed event-level Fanmass aggregates and progress fields; photo results are the only active source.',
          document: {
            projectId: project._id,
            stats: obsoleteStats,
            aiLastAnalyzedAt: project.aiLastAnalyzedAt,
            fanmassPhotoResultReceivedAt: project.fanmassPhotoResultReceivedAt,
          },
        },
      },
      { upsert: true },
    );
  }
  const archivedProjectStats = await projectArchive.countDocuments({
    sourceCollection: 'projects.stats',
    sourceId: { $in: projectsToClean.map(({ project }) => idText(project._id)) },
  });
  if (archivedProjectStats !== projectsToClean.length) {
    throw new Error(`Archive verification failed for project stats: expected ${projectsToClean.length}, found ${archivedProjectStats}.`);
  }

  for (const { project, obsoleteStats } of projectsToClean) {
    const unset: Record<string, ''> = {
      aiLastAnalyzedAt: '',
      fanmassPhotoResultReceivedAt: '',
    };
    for (const key of Object.keys(obsoleteStats)) unset[`stats.${key}`] = '';
    await db.collection('projects').updateOne({ _id: project._id }, { $unset: unset });
  }

  await archiveDocuments(db, 'variables_metadata', variableRows, 'Replaced by the canonical one-photo result variable catalogue.');
  if (variableRows.length) {
    await variableCollection.deleteMany({ _id: { $in: variableRows.map((row) => row._id) } });
  }
  await ensureFanmassAnalyticsVariables(db, FANMASS_PHOTO_VARIABLE_NAMES);

  const rebuilt = [];
  for (const rawEventId of eventIds) {
    const eventId = String(rawEventId);
    rebuilt.push(await rebuildFanmassPhotoEventSummary(eventId));
  }

  const remainingSummaryCount = await summaries.countDocuments({});
  const remainingSnapshots = await snapshotCollection.countDocuments({});
  const remainingEventLinks = await eventLinkCollection.countDocuments({});
  const remainingRescanRequests = await rescanCollection.countDocuments({});
  const rebuiltSummaryCount = await summaries.countDocuments({
    sourceType: 'camera_photo_pipeline',
    contractVersion: 'messmass.camera-photo-results.v1',
  });
  const activeVariables = await variableCollection.countDocuments({ name: /^fanmass/ });
  const canonicalVariables = await variableCollection.countDocuments({ name: { $in: [...FANMASS_PHOTO_VARIABLE_NAMES] } });
  const finalArchivedProjectStats = await projectArchive.countDocuments({ sourceCollection: 'projects.stats' });
  const leftoverLegacyStats = await db.collection('projects').aggregate([
    { $project: { pairs: { $objectToArray: { $cond: [{ $eq: [{ $type: '$stats' }, 'object'] }, '$stats', {}] } } } },
    { $unwind: '$pairs' },
    { $match: { 'pairs.k': /^fanmass/ } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]).toArray();
  const final = {
    archivedSummaryDocuments: summaryRows.length,
    retainedPhotoResults: activePhotos,
    rebuiltEventSummaries: rebuilt.length,
    remainingSummaryDocuments: remainingSummaryCount,
    remainingDashboardSnapshots: remainingSnapshots,
    remainingEventBatchLinks: remainingEventLinks,
    remainingEventWideRescanRequests: remainingRescanRequests,
    currentContractSummaries: rebuiltSummaryCount,
    activeFanmassVariableDefinitions: activeVariables,
    canonicalFanmassVariableDefinitions: canonicalVariables,
    archivedProjectsWithLegacyStats: finalArchivedProjectStats,
    leftoverLegacyProjectStatFields: Number(leftoverLegacyStats[0]?.count || 0),
  };
  process.stdout.write(`${JSON.stringify({ result: final }, null, 2)}\n`);
  if (remainingSummaryCount !== eventIds.length || rebuiltSummaryCount !== eventIds.length
    || remainingSnapshots !== 0 || remainingEventLinks !== 0 || remainingRescanRequests !== 0
    || activeVariables !== canonicalVariables || canonicalVariables !== FANMASS_PHOTO_VARIABLE_NAMES.size
    || finalArchivedProjectStats < projectsToClean.length || Number(leftoverLegacyStats[0]?.count || 0) !== 0) {
    throw new Error('Post-cleanup verification failed; stop and inspect the archive before further changes.');
  }
}

main()
  .catch((error) => {
    process.stderr.write(`Fanmass analytics cleanup failed: ${error instanceof Error ? error.message : 'unknown error'}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = await clientPromise;
    await client.close();
  });
