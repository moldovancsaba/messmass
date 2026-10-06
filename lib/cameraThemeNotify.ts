// lib/cameraThemeNotify.ts
// WHAT: Tells camera that the look of its events changed in messmass (a report style was edited or deleted, a partner's logo, name or
//     style changed), so camera takes a new snapshot of the affected events: the colours and logo of its guest pages and the generated
//     frame follow messmass.
// WHY: camera keeps a snapshot of the messmass theme per event (camera#231, camera#285). Without this it would only notice a change
//     when an admin presses refresh.
// HOW: best-effort POST to camera's /api/internal/messmass/theme-updated with the shared secret, bounded by a short timeout. It never
//     throws and never blocks the save for long: camera also refreshes a stale snapshot by itself the next time a guest opens the event.
import { ObjectId, type Db } from 'mongodb';
import { cameraConfigured } from '@/lib/cameraClient';
import config from '@/lib/config';
import { error as logError } from '@/lib/logger';

const TIMEOUT_MS = 4000;
const MAX_EVENTS = 500;

export type CameraThemeChange = { scope: 'all' } | { scope: 'events'; messmassEventIds: string[] };

export async function notifyCameraThemeChanged(change: CameraThemeChange): Promise<boolean> {
  if (!cameraConfigured()) return false;
  if (change.scope === 'events' && change.messmassEventIds.length === 0) return false;
  try {
    const base = (config.cameraBaseUrl || '').replace(/\/$/, '');
    const secret = config.cameraProvisionToken || '';
    const res = await fetch(`${base}/api/internal/messmass/theme-updated`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-messmass-secret': secret, authorization: `Bearer ${secret}` },
      body: JSON.stringify(change.scope === 'all' ? change : { scope: 'events', messmassEventIds: change.messmassEventIds.slice(0, MAX_EVENTS) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch (error) {
    logError('Camera theme notification failed (non-fatal)', { context: 'camera-theme' }, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/** The events (projects) that show this partner as a team or as their organiser: the ones whose camera theme can change with it. */
export async function eventsOfPartner(db: Db, partnerId: string): Promise<string[]> {
  if (!ObjectId.isValid(partnerId)) return [];
  const id = new ObjectId(partnerId);
  const projects = await db
    .collection('projects')
    .find({ $or: [{ partner1Id: id }, { partner2Id: id }, { partnerId: id }, { partner1Id: partnerId }, { partner2Id: partnerId }, { partnerId }] }, { projection: { _id: 1 } })
    .limit(MAX_EVENTS)
    .toArray();
  return projects.map((project) => String(project._id));
}

/** A partner changed: tell camera about its events. Only the fields that reach camera's pages and frames trigger it. */
export async function notifyCameraPartnerChanged(db: Db, partnerId: string, changedFields: Record<string, unknown>): Promise<boolean> {
  const relevant = ['name', 'logoUrl', 'styleId', 'reportTemplateId', 'emoji', 'sportsDb'].some((field) => field in changedFields);
  if (!relevant || !cameraConfigured()) return false;
  try {
    return await notifyCameraThemeChanged({ scope: 'events', messmassEventIds: await eventsOfPartner(db, partnerId) });
  } catch (error) {
    logError('Camera partner notification failed (non-fatal)', { context: 'camera-theme', partnerId }, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
