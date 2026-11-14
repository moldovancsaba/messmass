// lib/fanmassDrivePhotos.ts
// WHAT: Drive photos that Fanmass placed in a Messmass event: the SZRT drive library, whose files carry no event, placed
//     by the owner's rule (photo order, club reads, fixture dates; scripts/szrt_assign_all.py in Fanmass) with a confidence.
// WHY: The hashtag report counts these photos for the events they were placed in. Each record says how sure the placement
//     is, that the opt-in was recorded (an image reaches the drive only with one), and, once Fanmass analysed the photo,
//     the measured people and the brand and club names read from the picture. No consent text, no identity, no image.

import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export const DRIVE_PHOTOS_CONTRACT = 'fanmass.messmass.event-drive-photos.v1';
export const DRIVE_PHOTOS_COLLECTION = 'fanmass_event_drive_photos';
export const MAX_DRIVE_PHOTOS_PER_REQUEST = 500;

export interface DrivePhotoAnalysis {
  people: number;
  genders: { male: number; female: number };
  ageGroups: { children: number; teens: number; adults: number; seniors: number };
  emotions: Record<string, number>;
  /** Names read from the picture only. */
  brands: string[];
  clubs: string[];
}

export interface DrivePhoto {
  photoId: string;
  sport: string;
  assignment: { confidence: number; method: string };
  optIn: { received: true; basis: 'local_drive_policy' };
  analysis: DrivePhotoAnalysis | null;
}

function invalid(message: string): never {
  throw Object.assign(new Error(message), { status: 400, code: 'INVALID_DRIVE_PHOTOS' });
}

const rec = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

function count(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100000) invalid(`${field} must be a whole number.`);
  return value as number;
}

function names(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 50) invalid(`${field} must be a list of names.`);
  const out = (value as unknown[]).map((v) => (typeof v === 'string' ? v.trim() : ''));
  if (out.some((v) => !v || v.length > 100)) invalid(`${field} must hold names of 1 to 100 characters.`);
  return [...new Set(out)];
}

function analysis(value: unknown, at: string): DrivePhotoAnalysis | null {
  if (value === null || value === undefined) return null;
  const a = rec(value) ?? invalid(`${at}.analysis must be an object or null.`);
  const g = rec(a.genders) ?? {};
  const ag = rec(a.ageGroups) ?? {};
  const emotions: Record<string, number> = {};
  for (const [k, v] of Object.entries(rec(a.emotions) ?? {})) {
    if (!/^[a-z_]{1,30}$/.test(k)) invalid(`${at}.analysis.emotions has an invalid name.`);
    emotions[k] = count(v, `${at}.analysis.emotions.${k}`);
  }
  return {
    people: count(a.people ?? 0, `${at}.analysis.people`),
    genders: { male: count(g.male ?? 0, `${at}.male`), female: count(g.female ?? 0, `${at}.female`) },
    ageGroups: {
      children: count(ag.children ?? 0, `${at}.children`), teens: count(ag.teens ?? 0, `${at}.teens`),
      adults: count(ag.adults ?? 0, `${at}.adults`), seniors: count(ag.seniors ?? 0, `${at}.seniors`),
    },
    emotions,
    brands: names(a.brands, `${at}.analysis.brands`),
    clubs: names(a.clubs, `${at}.analysis.clubs`),
  };
}

const PHOTO_ID = /^[A-Za-z ]{1,30}\/[A-Za-z0-9._-]{1,120}$/;

/**
 * Read a request: `photos` to place in this event and `remove`, the ids of photos that left it (their cluster was
 * decided again and moved them, or they wait for evidence). At least one of the two holds something.
 */
export function parseDrivePhotos(body: unknown, eventIdFromPath: string): { messmassEventId: string; photos: DrivePhoto[]; remove: string[] } {
  const raw = rec(body) ?? invalid('A JSON object is required.');
  if (raw.contractVersion !== DRIVE_PHOTOS_CONTRACT) {
    throw Object.assign(new Error(`Expected ${DRIVE_PHOTOS_CONTRACT}.`), { status: 409, code: 'CONTRACT_MISMATCH' });
  }
  if (raw.messmassEventId !== eventIdFromPath) invalid('messmassEventId must match the path.');
  const rawRemove = raw.remove === undefined ? [] : raw.remove;
  if (!Array.isArray(rawRemove) || rawRemove.length > MAX_DRIVE_PHOTOS_PER_REQUEST || rawRemove.some((id) => typeof id !== 'string' || !PHOTO_ID.test(id))) {
    invalid(`remove must list at most ${MAX_DRIVE_PHOTOS_PER_REQUEST} photo ids (<sport>/<file>).`);
  }
  if (!Array.isArray(raw.photos) || raw.photos.length > MAX_DRIVE_PHOTOS_PER_REQUEST || (raw.photos.length === 0 && rawRemove.length === 0)) {
    invalid(`photos must hold up to ${MAX_DRIVE_PHOTOS_PER_REQUEST} photos, and a request must place or remove at least one.`);
  }
  const photos = (raw.photos as unknown[]).map((item, i) => {
    const at = `photos[${i}]`;
    const p = rec(item) ?? invalid(`${at} must be an object.`);
    const photoId = typeof p.photoId === 'string' ? p.photoId.trim() : '';
    if (!PHOTO_ID.test(photoId)) invalid(`${at}.photoId must be <sport>/<file>.`);
    const assignment = rec(p.assignment) ?? invalid(`${at}.assignment is required.`);
    const confidence = assignment.confidence;
    if (typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) invalid(`${at}.assignment.confidence must be 0 to 1.`);
    const method = typeof assignment.method === 'string' ? assignment.method.trim() : '';
    if (!/^[a-z_]{1,40}$/.test(method)) invalid(`${at}.assignment.method is required.`);
    const optIn = rec(p.optIn);
    if (!optIn || optIn.received !== true || optIn.basis !== 'local_drive_policy') {
      invalid(`${at}.optIn must record the opt-in (received true, basis local_drive_policy).`);
    }
    return {
      photoId,
      sport: photoId.split('/')[0],
      assignment: { confidence: Math.round((confidence as number) * 1000) / 1000, method },
      optIn: { received: true as const, basis: 'local_drive_policy' as const },
      analysis: analysis(p.analysis, at),
    };
  });
  return { messmassEventId: eventIdFromPath, photos, remove: [...new Set(rawRemove as string[])] };
}

/**
 * Store the photos under the event (a photo placed earlier in another event moves here: one photo, one event) and drop
 * the photos that left it. Only a photo still filed under this event is dropped, so a late request cannot remove a photo
 * that has since moved on.
 */
export async function storeDrivePhotos(
  db: Db,
  eventId: string,
  photos: DrivePhoto[],
  remove: string[] = [],
  now = new Date().toISOString(),
): Promise<{ stored: number; removed: number }> {
  if (!ObjectId.isValid(eventId)) invalid('Invalid Messmass event id.');
  const event = await db.collection('projects').findOne({ _id: new ObjectId(eventId) }, { projection: { _id: 1 } });
  if (!event) throw Object.assign(new Error('Messmass event was not found.'), { status: 404, code: 'EVENT_NOT_FOUND' });
  const collection = db.collection<Record<string, unknown> & { _id: string }>(DRIVE_PHOTOS_COLLECTION);
  await collection.createIndex({ eventId: 1 }, { name: 'drive_photos_by_event' });
  const removed = remove.length ? (await collection.deleteMany({ _id: { $in: remove }, eventId })).deletedCount ?? 0 : 0;
  if (photos.length === 0) return { stored: 0, removed };
  await collection.bulkWrite(
    photos.map((photo) => ({
      updateOne: {
        filter: { _id: photo.photoId },
        update: { $set: { eventId, sport: photo.sport, assignment: photo.assignment, optIn: photo.optIn, analysis: photo.analysis, receivedAt: now } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  return { stored: photos.length, removed };
}
