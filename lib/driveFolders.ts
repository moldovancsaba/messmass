// lib/driveFolders.ts
// WHAT: Data access for the `drive_folder_links` collection — the self-service
//       "link a Google Drive folder to an event" feature.
// WHY: Kept as its own collection (one doc per folder link) rather than an
//      embedded array on `projects`, so fanmass can write per-folder status
//      back independently and concurrently without racing the big
//      manual-`$set` PUT /api/projects handler. See the plan's "Design
//      decisions" section for the full reasoning. messmass never reads Drive
//      itself — it only stores whatever URL an admin pastes; fanmass's own
//      service account is the sole reader/access authority.

import { Db, ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';
import { extractDriveFolderId, buildDriveFolderUrl } from './googleDriveFolder';

// WHAT: Lifecycle of a linked Drive folder, from the operator's point of view.
// WHY: 'verified' only ever meant "fanmass finished reading the folder", which is
//     not the question an operator is asking. A folder could read as verified
//     while none of its images had been analysed and the event's variables were
//     still empty — observed live with 411 photos. The vocabulary now tracks the
//     whole pipeline so the badge answers "is this event's data ready?".
// HOW: 'verified' is retained so an older fanmass keeps working; it is treated as
//     a synonym for 'analyzing' until real counts arrive.
export type DriveFolderStatus =
  | 'pending'    // linked; fanmass has not read it yet
  | 'analyzing'  // images pulled and staged; analysis in progress
  | 'complete'   // every discovered image analysed
  | 'empty'      // read successfully, contained no images
  | 'error'      // failed; lastError carries the reason
  | 'verified';  // deprecated: pre-analysis-aware fanmass builds

export interface DriveFolderLink {
  _id: string;
  eventId: string;
  folderId: string;
  folderUrl: string;
  label?: string;
  status: DriveFolderStatus;
  lastError?: string;
  lastCheckedAt?: string;
  // WHAT: Progress counters reported by fanmass alongside the status.
  // WHY: Let the UI show how far along an analysis is instead of a binary badge,
  //     and distinguish "no images found" from "images not analysed yet".
  imagesDiscovered?: number;
  imagesAnalyzed?: number;
  // WHAT: Operator controls, both read by fanmass's poll rather than pushed to it
  //     — fanmass has no reachable address of its own, so a "command" is just a
  //     field on the doc that the next poll notices.
  // WHY paused: a folder that is fully analysed, or was linked ahead of images
  //     that never arrived, still gets walked every poll cycle forever with
  //     nothing to show for it. Pausing removes it from fanmass's discovery
  //     entirely until resumed.
  // WHY syncRequestedAt: the normal poll runs on a fixed interval (default 30
  //     min); this lets an operator ask for "check now" instead of waiting.
  //     Cleared automatically the next time fanmass reports back a status for
  //     this folder, since any report means the request was served.
  paused?: boolean;
  syncRequestedAt?: string;
  addedBy?: string;
  createdAt: string;
  updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toDriveFolderLink(doc: any): DriveFolderLink {
  return {
    _id: String(doc._id),
    eventId: String(doc.eventId),
    folderId: doc.folderId,
    folderUrl: doc.folderUrl,
    label: doc.label ?? undefined,
    status: doc.status || 'pending',
    lastError: doc.lastError ?? undefined,
    lastCheckedAt: doc.lastCheckedAt ?? undefined,
    imagesDiscovered: typeof doc.imagesDiscovered === 'number' ? doc.imagesDiscovered : undefined,
    imagesAnalyzed: typeof doc.imagesAnalyzed === 'number' ? doc.imagesAnalyzed : undefined,
    paused: doc.paused === true,
    syncRequestedAt: doc.syncRequestedAt ?? undefined,
    addedBy: doc.addedBy ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function ensureDriveFolderIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection('drive_folder_links').createIndex({ eventId: 1, folderId: 1 }, { unique: true }),
    db.collection('drive_folder_links').createIndex({ status: 1 }),
  ]);
}

export async function addDriveFolder(input: {
  eventId: string;
  rawInput: string;
  label?: string;
  addedBy?: string;
}): Promise<DriveFolderLink> {
  if (!ObjectId.isValid(input.eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }

  // Server-side re-validation — never trust client-side extraction alone.
  const folderId = extractDriveFolderId(input.rawInput);
  if (!folderId) {
    throw Object.assign(new Error('Could not find a Google Drive folder ID in that input.'), {
      status: 400,
      code: 'INVALID_DRIVE_FOLDER_URL',
    });
  }

  const db = await getDb();
  await ensureDriveFolderIndexes(db);

  const event = await db.collection('projects').findOne({ _id: new ObjectId(input.eventId) }, { projection: { _id: 1 } });
  if (!event) {
    throw Object.assign(new Error('Event was not found.'), { status: 404, code: 'EVENT_NOT_FOUND' });
  }

  const existing = await db.collection('drive_folder_links').findOne({ eventId: input.eventId, folderId });
  if (existing) {
    throw Object.assign(new Error('This Drive folder is already linked to this event.'), {
      status: 409,
      code: 'DRIVE_FOLDER_ALREADY_LINKED',
    });
  }

  const timestamp = nowIso();
  const doc = {
    eventId: input.eventId,
    folderId,
    folderUrl: buildDriveFolderUrl(folderId),
    label: input.label?.trim() || undefined,
    status: 'pending' as DriveFolderStatus,
    addedBy: input.addedBy || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const result = await db.collection('drive_folder_links').insertOne(doc);
  return toDriveFolderLink({ ...doc, _id: result.insertedId });
}

export async function listDriveFolders(eventId: string): Promise<DriveFolderLink[]> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  await ensureDriveFolderIndexes(db);
  const docs = await db.collection('drive_folder_links').find({ eventId }).sort({ createdAt: -1 }).toArray();
  return docs.map(toDriveFolderLink);
}

export async function removeDriveFolder(eventId: string, linkId: string): Promise<void> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  if (!ObjectId.isValid(linkId)) {
    throw Object.assign(new Error('Invalid link id.'), { status: 422, code: 'INVALID_LINK_ID' });
  }
  const db = await getDb();
  const result = await db.collection('drive_folder_links').deleteOne({ _id: new ObjectId(linkId), eventId });
  if (result.deletedCount === 0) {
    throw Object.assign(new Error('Drive folder link was not found for this event.'), {
      status: 404,
      code: 'DRIVE_FOLDER_LINK_NOT_FOUND',
    });
  }
}

export async function setDriveFolderStatus(
  eventId: string,
  folderId: string,
  status: DriveFolderStatus,
  lastError?: string,
  progress?: { imagesDiscovered?: number; imagesAnalyzed?: number }
): Promise<DriveFolderLink> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  // WHAT: Only write counters fanmass actually sent.
  // WHY: A poll that reports status without counts must not silently zero the
  //     progress a previous poll established, or the badge would flap back to 0%.
  const counters: Record<string, number> = {};
  if (typeof progress?.imagesDiscovered === 'number') {
    counters.imagesDiscovered = Math.max(0, Math.trunc(progress.imagesDiscovered));
  }
  if (typeof progress?.imagesAnalyzed === 'number') {
    counters.imagesAnalyzed = Math.max(0, Math.trunc(progress.imagesAnalyzed));
  }
  const result = await db.collection('drive_folder_links').findOneAndUpdate(
    { eventId, folderId },
    {
      $set: {
        status,
        lastCheckedAt: timestamp,
        updatedAt: timestamp,
        ...counters,
        ...(status === 'error' && lastError ? { lastError } : {}),
      },
      // Any status report means fanmass just polled this folder, which serves
      // whatever sync-now request was pending — clear it here rather than
      // trusting fanmass to ack it separately, so a request can never leak
      // past the poll that actually fulfilled it.
      $unset: {
        ...(status !== 'error' ? { lastError: '' } : {}),
        syncRequestedAt: '',
      },
    },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw Object.assign(new Error('Drive folder link was not found.'), {
      status: 404,
      code: 'DRIVE_FOLDER_LINK_NOT_FOUND',
    });
  }
  return toDriveFolderLink(result);
}

// WHAT: Operator override — remove/return a folder to fanmass's poll rotation.
// WHY: A folder that is done, or was linked ahead of images that never came,
//     otherwise gets walked forever for nothing. See DriveFolderLink.paused.
export async function setDriveFolderPaused(
  eventId: string,
  linkId: string,
  paused: boolean
): Promise<DriveFolderLink> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  if (!ObjectId.isValid(linkId)) {
    throw Object.assign(new Error('Invalid link id.'), { status: 422, code: 'INVALID_LINK_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  const result = await db.collection('drive_folder_links').findOneAndUpdate(
    { _id: new ObjectId(linkId), eventId },
    { $set: { paused, updatedAt: timestamp } },
    { returnDocument: 'after' }
  );
  if (!result) {
    throw Object.assign(new Error('Drive folder link was not found.'), {
      status: 404,
      code: 'DRIVE_FOLDER_LINK_NOT_FOUND',
    });
  }
  return toDriveFolderLink(result);
}

// WHAT: Operator override — ask fanmass to check this folder before its next
//     scheduled poll. See DriveFolderLink.syncRequestedAt.
// WHY: A paused folder cannot be force-checked — resume it first, since
//     "check now" on a folder fanmass has been told to ignore would be
//     confusing (it would appear to work once, then go back to being ignored).
export async function requestDriveFolderSync(eventId: string, linkId: string): Promise<DriveFolderLink> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  if (!ObjectId.isValid(linkId)) {
    throw Object.assign(new Error('Invalid link id.'), { status: 422, code: 'INVALID_LINK_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  const result = await db.collection('drive_folder_links').findOneAndUpdate(
    { _id: new ObjectId(linkId), eventId, paused: { $ne: true } },
    { $set: { syncRequestedAt: timestamp, updatedAt: timestamp } },
    { returnDocument: 'after' }
  );
  if (!result) {
    const existing = await db.collection('drive_folder_links').findOne({ _id: new ObjectId(linkId), eventId });
    if (existing?.paused) {
      throw Object.assign(new Error('This folder is paused. Resume it before requesting a check.'), {
        status: 409,
        code: 'DRIVE_FOLDER_PAUSED',
      });
    }
    throw Object.assign(new Error('Drive folder link was not found.'), {
      status: 404,
      code: 'DRIVE_FOLDER_LINK_NOT_FOUND',
    });
  }
  return toDriveFolderLink(result);
}

// WHAT: Event-scoped Check now / Pause / Resume, over every folder linked to
//     the event at once.
// WHY: The AI Analytics coverage list has one row per event, not per folder —
//     an operator scanning that list for a "Failed" event wants to act on the
//     event, not first find which of its (usually one, occasionally several)
//     Drive folders is the problem.
export async function requestDriveFolderSyncForEvent(eventId: string): Promise<number> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  const result = await db.collection('drive_folder_links').updateMany(
    { eventId, paused: { $ne: true } },
    { $set: { syncRequestedAt: timestamp, updatedAt: timestamp } }
  );
  return result.modifiedCount;
}

export async function setDriveFolderPausedForEvent(eventId: string, paused: boolean): Promise<number> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  const result = await db.collection('drive_folder_links').updateMany(
    { eventId },
    { $set: { paused, updatedAt: timestamp } }
  );
  return result.modifiedCount;
}

export interface ActiveDriveFolderEventGroup {
  eventId: string;
  eventName: string;
  partnerIds: string[];
  partnerNames: string[];
  folders: Array<{
    folderId: string;
    folderUrl: string;
    label?: string;
    status: DriveFolderStatus;
    imagesDiscovered?: number;
    imagesAnalyzed?: number;
  }>;
}

/**
 * Bulk discovery for fanmass: every event that has at least one linked Drive
 * folder, plus enough metadata (eventName, partnerIds, partnerNames) for
 * fanmass to auto-provision a batch via its existing upsert_messmass_batch(),
 * exactly like the camera path does. One bulk call instead of N per-event
 * context fetches — there's no existing "list linked events" endpoint fanmass
 * could poll cheaply otherwise, and a Drive-only event (no camera link) would
 * never be discovered any other way.
 */
export async function listActiveDriveFoldersGroupedByEvent(): Promise<ActiveDriveFolderEventGroup[]> {
  const db = await getDb();
  await ensureDriveFolderIndexes(db);

  // Paused folders are deliberately absent from fanmass's discovery — see
  // DriveFolderLink.paused — rather than included with a flag fanmass must
  // remember to check, so a future caller of this function can't reintroduce
  // polling for one by skipping that check.
  const links = await db.collection('drive_folder_links').find({ paused: { $ne: true } }).toArray();
  if (links.length === 0) return [];

  const eventIds = Array.from(new Set(links.map((link) => String(link.eventId))));
  const objectIds = eventIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const events = await db.collection('projects').find({ _id: { $in: objectIds } }).toArray();
  const eventById = new Map(events.map((event) => [String(event._id), event]));

  const partnerIdSet = new Set<string>();
  for (const event of events) {
    const ids = [event.partner1Id, event.partner2Id, ...(Array.isArray(event.partnerIds) ? event.partnerIds : [])]
      .map((value) => {
        if (value instanceof ObjectId) return value.toString();
        if (typeof value === 'string' && ObjectId.isValid(value)) return value;
        return null;
      })
      .filter((value): value is string => Boolean(value));
    ids.forEach((id) => partnerIdSet.add(id));
  }
  const partnerObjectIds = Array.from(partnerIdSet).map((id) => new ObjectId(id));
  const partners = partnerObjectIds.length
    ? await db.collection('partners').find({ _id: { $in: partnerObjectIds } }).toArray()
    : [];
  const partnerById = new Map(partners.map((partner) => [String(partner._id), partner]));

  const linksByEvent = new Map<string, typeof links>();
  for (const link of links) {
    const key = String(link.eventId);
    if (!linksByEvent.has(key)) linksByEvent.set(key, []);
    linksByEvent.get(key)!.push(link);
  }

  const groups: ActiveDriveFolderEventGroup[] = [];
  for (const [eventId, eventLinks] of linksByEvent.entries()) {
    const event = eventById.get(eventId);
    if (!event) continue; // orphaned link (event deleted) — skip rather than surface a dangling reference

    const partnerIds = [event.partner1Id, event.partner2Id, ...(Array.isArray(event.partnerIds) ? event.partnerIds : [])]
      .map((value) => {
        if (value instanceof ObjectId) return value.toString();
        if (typeof value === 'string' && ObjectId.isValid(value)) return value;
        return null;
      })
      .filter((value): value is string => Boolean(value));
    const uniquePartnerIds = Array.from(new Set(partnerIds));

    groups.push({
      eventId,
      eventName: String(event.eventName || event.name || 'Untitled event'),
      partnerIds: uniquePartnerIds,
      partnerNames: uniquePartnerIds.map((id) => String(partnerById.get(id)?.name || '')).filter(Boolean),
      folders: eventLinks.map((link) => ({
        folderId: link.folderId,
        folderUrl: link.folderUrl,
        label: link.label ?? undefined,
        status: link.status || 'pending',
        // Progress travels with the status so a consumer can render "analysing,
        // 154 of 386" without a second round trip per folder.
        imagesDiscovered: link.imagesDiscovered,
        imagesAnalyzed: link.imagesAnalyzed,
      })),
    });
  }

  return groups;
}

// WHAT: Folder ids with a live "check now" request, for fanmass to poll
//     cheaply and often — cheap enough to check every worker loop tick rather
//     than waiting for the normal interval, unlike listActiveDriveFoldersGroupedByEvent
//     (which joins events/partners and is only meant for the full sweep).
// WHY: "Check now" needs to feel closer to instant than the ~30 min default
//     poll interval without shortening that interval for every folder.
export async function listPendingSyncFolderIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .collection('drive_folder_links')
    .find(
      { paused: { $ne: true }, syncRequestedAt: { $exists: true, $ne: null } },
      { projection: { folderId: 1 } }
    )
    .toArray();
  return rows.map((row) => String(row.folderId));
}
