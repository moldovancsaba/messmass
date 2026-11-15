import { type Db } from 'mongodb';
import { getDb } from '@/lib/fanmassIntegration';
import { proveCameraEventLink } from '@/lib/cameraEventLink';

function fail(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

/**
 * Resolve the Messmass-owned event from the cross-product IDs Camera supplies.
 * A name, email, or client-selected Messmass id is never used to find the row.
 * Ambiguous and stale links fail closed so an erasure cannot hit another event.
 * The one event whose own Camera link names the Camera event is the proof (lib/cameraEventLink.ts, owner answer 514):
 * its partners may differ from the Camera event's partner, and that must not block an erasure.
 */
export async function resolveMessmassEventForCameraPhotoErasure(
  input: { cameraPartnerId: string; cameraEventId: string },
  dependencies: { getDb?: () => Promise<Db> } = {},
): Promise<string> {
  const cameraPartnerId = input.cameraPartnerId.trim();
  const cameraEventId = input.cameraEventId.trim();
  if (!cameraPartnerId || cameraPartnerId.length > 160 || !cameraEventId || cameraEventId.length > 160) {
    fail(400, 'INVALID_CAMERA_REFERENCE', 'Camera partner and event references are required.');
  }

  const db = await (dependencies.getDb || getDb)();
  const matches = await db.collection('projects')
    .find({ 'externalRefs.camera.eventId': cameraEventId }, { projection: { _id: 1, externalRefs: 1, partnerId: 1, partner1Id: 1, partner2Id: 1 } })
    .limit(2)
    .toArray();
  if (matches.length === 0) fail(404, 'CAMERA_EVENT_LINK_NOT_FOUND', 'No Messmass event is linked to this Camera event.');
  if (matches.length !== 1) fail(409, 'CAMERA_EVENT_LINK_AMBIGUOUS', 'The Camera event is linked to multiple Messmass events.');

  const project = matches[0];
  const proof = await proveCameraEventLink(db, project, { cameraEventId, cameraPartnerId });
  if (!proof.proven) {
    if (proof.reason === 'no_partner') fail(409, 'CAMERA_PARTNER_LINK_NOT_FOUND', 'The Messmass event has no linked partner.');
    fail(409, proof.reason === 'partner_ambiguous' ? 'CAMERA_PARTNER_LINK_AMBIGUOUS' : 'CAMERA_PARTNER_ID_MISMATCH', 'The Camera partner is not linked uniquely to this Messmass event.');
  }
  return String(project._id);
}
