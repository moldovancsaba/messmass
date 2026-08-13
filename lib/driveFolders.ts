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

export type DriveFolderStatus = 'pending' | 'verified' | 'error';

export interface DriveFolderLink {
  _id: string;
  eventId: string;
  folderId: string;
  folderUrl: string;
  label?: string;
  status: DriveFolderStatus;
  lastError?: string;
  lastCheckedAt?: string;
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
  lastError?: string
): Promise<DriveFolderLink> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const db = await getDb();
  const timestamp = nowIso();
  const result = await db.collection('drive_folder_links').findOneAndUpdate(
    { eventId, folderId },
    {
      $set: {
        status,
        lastCheckedAt: timestamp,
        updatedAt: timestamp,
        ...(status === 'error' && lastError ? { lastError } : {}),
      },
      ...(status !== 'error' ? { $unset: { lastError: '' } } : {}),
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

export interface ActiveDriveFolderEventGroup {
  eventId: string;
  eventName: string;
  partnerIds: string[];
  partnerNames: string[];
  folders: Array<{ folderId: string; folderUrl: string; label?: string; status: DriveFolderStatus }>;
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

  const links = await db.collection('drive_folder_links').find({}).toArray();
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
      })),
    });
  }

  return groups;
}
