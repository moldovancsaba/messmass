// lib/cameraEventLink.ts
// WHAT: The one rule that decides whether a Camera delivery (a Fanmass photo result, a privacy erasure) belongs to a
//     Messmass event: the event's own Camera link names the delivery's Camera event, or else one of the event's partners
//     carries the delivery's Camera partner id.
// WHY: Owner answer 514 (2026-11-15), option B. The partner check alone refused event 6ae868f6548416c3f64562a4 (Beretta
//     Famila Schio vs Galatasaray) with 409 CAMERA_PARTNER_ID_MISMATCH: its partners are now the two clubs while the Camera
//     event's partner is EuroLeague Women, and a read-only scan found 49 of 459 Camera-linked events like it. The event's
//     link (externalRefs.camera.eventId) is set when Messmass and Camera link the event, so it is the proof; the partner
//     check remains for an event whose link does not name the delivery's Camera event. Neither matching is still refused.

import { ObjectId } from 'mongodb';

type PartnerLookup = { countDocuments: (filter: Record<string, unknown>) => Promise<number> };
type LinkDb = { collection: (name: string) => unknown };

export type CameraLinkProof =
  | { proven: true; by: 'event_link' }
  | { proven: true; by: 'partner' }
  | { proven: false; reason: 'no_partner' | 'partner_mismatch' | 'partner_ambiguous' };

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

/** The partner ids of an event (partner1Id, partner2Id, partnerId), as ObjectIds. */
export function eventPartnerIds(event: Record<string, unknown>): ObjectId[] {
  return [event.partner1Id, event.partner2Id, event.partnerId]
    .map((value) => (value instanceof ObjectId ? value : typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null))
    .filter((value): value is ObjectId => value !== null);
}

/** Does the Camera delivery belong to this event? The event's own Camera link first, then its partners. */
export async function proveCameraEventLink(
  db: LinkDb,
  event: Record<string, unknown>,
  delivery: { cameraEventId: string; cameraPartnerId: string },
): Promise<CameraLinkProof> {
  const link = record(record(event.externalRefs)?.camera);
  if (delivery.cameraEventId && link?.eventId === delivery.cameraEventId) return { proven: true, by: 'event_link' };

  const partnerIds = eventPartnerIds(event);
  if (!partnerIds.length) return { proven: false, reason: 'no_partner' };
  const matches = await (db.collection('partners') as PartnerLookup).countDocuments({ _id: { $in: partnerIds }, cameraPartnerId: delivery.cameraPartnerId });
  if (matches === 1) return { proven: true, by: 'partner' };
  return { proven: false, reason: matches > 1 ? 'partner_ambiguous' : 'partner_mismatch' };
}
