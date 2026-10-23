import { ObjectId, type Db } from 'mongodb';
import { getDb } from '@/lib/fanmassIntegration';

function fail(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

/**
 * Resolve the Messmass-owned event from the cross-product IDs Camera supplies.
 * A name, email, or client-selected Messmass id is never used to find the row.
 * Ambiguous and stale links fail closed so an erasure cannot hit another event.
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
    .find({ 'externalRefs.camera.eventId': cameraEventId }, { projection: { _id: 1, partnerId: 1, partner1Id: 1, partner2Id: 1 } })
    .limit(2)
    .toArray();
  if (matches.length === 0) fail(404, 'CAMERA_EVENT_LINK_NOT_FOUND', 'No Messmass event is linked to this Camera event.');
  if (matches.length !== 1) fail(409, 'CAMERA_EVENT_LINK_AMBIGUOUS', 'The Camera event is linked to multiple Messmass events.');

  const project = matches[0];
  const partnerIds = [project.partner1Id, project.partner2Id, project.partnerId]
    .map((value) => value instanceof ObjectId
      ? value
      : (typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null))
    .filter((value): value is ObjectId => value !== null);
  if (!partnerIds.length) fail(409, 'CAMERA_PARTNER_LINK_NOT_FOUND', 'The Messmass event has no linked partner.');

  const partnerMatches = await db.collection('partners').countDocuments({
    _id: { $in: partnerIds },
    cameraPartnerId,
  });
  if (partnerMatches !== 1) {
    fail(409, partnerMatches > 1 ? 'CAMERA_PARTNER_LINK_AMBIGUOUS' : 'CAMERA_PARTNER_ID_MISMATCH', 'The Camera partner is not linked uniquely to this Messmass event.');
  }
  return String(project._id);
}
