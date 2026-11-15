// tests/camera-event-link.test.ts
// WHAT: The one rule both Camera deliveries use (Fanmass photo results and privacy erasures) to decide that a delivery
//     belongs to a Messmass event (lib/cameraEventLink.ts, owner answer 514).
// WHY: Event 6ae868f6548416c3f64562a4 (Beretta Famila Schio vs Galatasaray) was refused with 409
//     CAMERA_PARTNER_ID_MISMATCH: its partners are the two clubs, the Camera event's partner is EuroLeague Women. The
//     event's own Camera link is the proof; when it does not name the delivery's Camera event a partner still can; when
//     neither matches the delivery is refused.

import { ObjectId } from 'mongodb';
import { eventPartnerIds, proveCameraEventLink } from '@/lib/cameraEventLink';

const club1 = new ObjectId('6ac3973a6a46ecfccd53e001');
const club2 = new ObjectId('6ac3973a6a46ecfccd53e002');

function db(partnersWithCameraId: number) {
  const countDocuments = jest.fn().mockResolvedValue(partnersWithCameraId);
  return { db: { collection: jest.fn(() => ({ countDocuments })) }, countDocuments };
}

const beretta = { _id: new ObjectId(), externalRefs: { camera: { eventId: 'cam-event-beretta' } }, partner1Id: club1, partner2Id: club2 };

describe('a Camera delivery belongs to a Messmass event', () => {
  it('when the event\'s own Camera link names the Camera event, whatever its partners are', async () => {
    const fake = db(0);
    await expect(proveCameraEventLink(fake.db, beretta, { cameraEventId: 'cam-event-beretta', cameraPartnerId: 'cam-partner-euroleague-women' }))
      .resolves.toEqual({ proven: true, by: 'event_link' });
    expect(fake.countDocuments).not.toHaveBeenCalled();
  });

  it('through a partner carrying the Camera partner id, the old path, when the event link names another Camera event', async () => {
    const fake = db(1);
    await expect(proveCameraEventLink(fake.db, beretta, { cameraEventId: 'cam-event-other', cameraPartnerId: 'cam-partner-club' }))
      .resolves.toEqual({ proven: true, by: 'partner' });
    expect(fake.countDocuments).toHaveBeenCalledWith({ _id: { $in: [club1, club2] }, cameraPartnerId: 'cam-partner-club' });
  });

  it('is refused when neither the event link nor a partner matches', async () => {
    await expect(proveCameraEventLink(db(0).db, beretta, { cameraEventId: 'cam-event-other', cameraPartnerId: 'cam-partner-euroleague-women' }))
      .resolves.toEqual({ proven: false, reason: 'partner_mismatch' });
    await expect(proveCameraEventLink(db(2).db, beretta, { cameraEventId: 'cam-event-other', cameraPartnerId: 'cam-partner-club' }))
      .resolves.toEqual({ proven: false, reason: 'partner_ambiguous' });
    await expect(proveCameraEventLink(db(1).db, { _id: new ObjectId() }, { cameraEventId: 'cam-event-other', cameraPartnerId: 'p' }))
      .resolves.toEqual({ proven: false, reason: 'no_partner' });
  });

  it('never takes an empty Camera event id as a link', async () => {
    const unlinked = { ...beretta, externalRefs: { camera: { eventId: '' } } };
    await expect(proveCameraEventLink(db(0).db, unlinked, { cameraEventId: '', cameraPartnerId: 'p' }))
      .resolves.toEqual({ proven: false, reason: 'partner_mismatch' });
  });

  it('reads the partner ids stored as ObjectIds or as strings', () => {
    expect(eventPartnerIds({ partner1Id: club1, partner2Id: String(club2), partnerId: 'not-an-id' })).toEqual([club1, club2]);
  });
});
