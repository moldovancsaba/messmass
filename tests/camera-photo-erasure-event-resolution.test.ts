import { ObjectId } from 'mongodb';
import { resolveMessmassEventForCameraPhotoErasure } from '@/lib/privacy/cameraPhotoErasure';

const eventId = '507f1f77bcf86cd799439011';
const partnerId = new ObjectId('507f1f77bcf86cd799439012');

function fakeDb(projects: Record<string, unknown>[], matchingPartners = 1) {
  const projectCursor = {
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(projects),
  };
  const projectsCollection = { find: jest.fn().mockReturnValue(projectCursor) };
  const partnersCollection = { countDocuments: jest.fn().mockResolvedValue(matchingPartners) };
  return {
    db: { collection: jest.fn((name: string) => name === 'projects' ? projectsCollection : partnersCollection) },
    projectCursor,
    projectsCollection,
    partnersCollection,
  };
}

describe('Camera photo erasure event resolution', () => {
  it('resolves the single Messmass event from Camera event and partner IDs', async () => {
    const fake = fakeDb([{ _id: new ObjectId(eventId), partner1Id: partnerId }]);
    await expect(resolveMessmassEventForCameraPhotoErasure({
      cameraPartnerId: 'camera-partner-1',
      cameraEventId: 'camera-event-1',
    }, { getDb: jest.fn().mockResolvedValue(fake.db) as never })).resolves.toBe(eventId);
    expect(fake.projectsCollection.find).toHaveBeenCalledWith(
      { 'externalRefs.camera.eventId': 'camera-event-1' },
      { projection: { _id: 1, partnerId: 1, partner1Id: 1, partner2Id: 1 } },
    );
    expect(fake.projectCursor.limit).toHaveBeenCalledWith(2);
    expect(fake.partnersCollection.countDocuments).toHaveBeenCalledWith({
      _id: { $in: [partnerId] }, cameraPartnerId: 'camera-partner-1',
    });
  });

  it('fails closed when the Camera event has no Messmass link', async () => {
    const fake = fakeDb([]);
    await expect(resolveMessmassEventForCameraPhotoErasure({ cameraPartnerId: 'p', cameraEventId: 'e' }, {
      getDb: jest.fn().mockResolvedValue(fake.db) as never,
    })).rejects.toMatchObject({ status: 404, code: 'CAMERA_EVENT_LINK_NOT_FOUND' });
  });

  it('fails closed when duplicate Messmass event links exist', async () => {
    const fake = fakeDb([{ _id: new ObjectId(eventId) }, { _id: new ObjectId() }]);
    await expect(resolveMessmassEventForCameraPhotoErasure({ cameraPartnerId: 'p', cameraEventId: 'e' }, {
      getDb: jest.fn().mockResolvedValue(fake.db) as never,
    })).rejects.toMatchObject({ status: 409, code: 'CAMERA_EVENT_LINK_AMBIGUOUS' });
  });

  it('fails closed when the event is not linked to the supplied Camera partner', async () => {
    const fake = fakeDb([{ _id: new ObjectId(eventId), partner1Id: partnerId }], 0);
    await expect(resolveMessmassEventForCameraPhotoErasure({ cameraPartnerId: 'wrong-partner', cameraEventId: 'e' }, {
      getDb: jest.fn().mockResolvedValue(fake.db) as never,
    })).rejects.toMatchObject({ status: 409, code: 'CAMERA_PARTNER_ID_MISMATCH' });
  });
});
