import { ObjectId } from 'mongodb';

const EVENT_ID = new ObjectId().toHexString();
const PHOTO_ID = new ObjectId().toHexString();
const CAMERA_EVENT_ID = 'camera-event-1';
const CAMERA_PARTNER_ID = 'camera-partner-1';
const REVISION = 'a'.repeat(64);

function fakeDb(options: { project?: Record<string, unknown> | null; photo?: Record<string, unknown> | null }) {
  let photo = options.photo ? { ...options.photo } : null;
  const photoCollection = {
    createIndex: jest.fn(async () => undefined),
    findOne: jest.fn(async () => photo),
    updateOne: jest.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
      const existingPhoto = photo;
      if (existingPhoto) {
        Object.assign(existingPhoto, update.$set);
        for (const key of Object.keys(update.$unset || {})) delete existingPhoto[key];
        return { matchedCount: 1, upsertedCount: 0 };
      }
      const createdPhoto: Record<string, any> = { _id: filter._id, ...update.$set };
      for (const key of Object.keys(update.$unset || {})) delete createdPhoto[key];
      photo = createdPhoto;
      return { matchedCount: 0, upsertedCount: 1 };
    }),
    find: jest.fn(() => ({ toArray: async () => [] })),
  };
  const db = {
    collection: (name: string) => {
      if (name === 'projects') return { findOne: jest.fn(async () => options.project ?? null) };
      if (name === 'fanmass_camera_photo_analyses') return photoCollection;
      if (name === 'ai_analysis_summaries') return { updateOne: jest.fn(async () => ({ matchedCount: 0, upsertedCount: 1 })) };
      throw new Error(`Unexpected collection ${name}`);
    },
  };
  return { db, photo, photoCollection };
}

async function load(db: ReturnType<typeof fakeDb>['db']) {
  const pushEventStats = jest.fn();
  const ensureFanmassAnalyticsVariables = jest.fn();
  jest.doMock('@/lib/fanmassIntegration', () => ({ __esModule: true, getDb: jest.fn(async () => db) }));
  jest.doMock('@/lib/fanmassMapping', () => ({ __esModule: true, pushEventStats }));
  jest.doMock('@/lib/fanmassAnalyticsVariables', () => ({ __esModule: true, ensureFanmassAnalyticsVariables }));
  const loaded = await import('@/lib/fanmassPhotoAnalyses');
  return { tombstoneFanmassPhotoAnalysis: loaded.tombstoneFanmassPhotoAnalysis, pushEventStats, ensureFanmassAnalyticsVariables };
}

function tombstoneBody(overrides: Record<string, unknown> = {}) {
  return {
    contractVersion: 'fanmass.messmass.photo-analysis.v2',
    messmassEventId: EVENT_ID,
    cameraPartnerId: CAMERA_PARTNER_ID,
    cameraEventId: CAMERA_EVENT_ID,
    cameraPhotoId: PHOTO_ID,
    sourceRevision: REVISION,
    analysisGeneration: 4,
    reason: 'right_to_erasure',
    ...overrides,
  };
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('Fanmass photo tombstones after event removal', () => {
  it('erases the exact stored photo and acknowledges after the Messmass event is gone', async () => {
    const fake = fakeDb({
      project: null,
      photo: {
        _id: 'stable-photo-record',
        cameraEventId: CAMERA_EVENT_ID,
        cameraPartnerId: CAMERA_PARTNER_ID,
        eventId: EVENT_ID,
        cameraPhotoId: PHOTO_ID,
        analysisGeneration: 3,
        sourceRevision: 'b'.repeat(64),
        summary: { peopleCount: 1 },
        boxes: { people: [{}], faces: [], brandRegions: [] },
        analysis: { people: [{}] },
      },
    });
    const { tombstoneFanmassPhotoAnalysis, pushEventStats, ensureFanmassAnalyticsVariables } = await load(fake.db);

    const result = await tombstoneFanmassPhotoAnalysis(EVENT_ID, PHOTO_ID, tombstoneBody());

    expect(result.status).toBe('deleted');
    expect(fake.photo).toMatchObject({ status: 'deleted', tombstone: true, cameraEventId: CAMERA_EVENT_ID, cameraPartnerId: CAMERA_PARTNER_ID });
    expect(fake.photo).not.toHaveProperty('summary');
    expect(fake.photo).not.toHaveProperty('boxes');
    expect(fake.photo).not.toHaveProperty('analysis');
    expect(fake.photo).not.toHaveProperty('sourceRevision');
    expect(fake.photo).not.toHaveProperty('analysisGeneration');
    expect(fake.photoCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.any(String) }),
      expect.objectContaining({ $unset: expect.objectContaining({ analyzedAt: '', summary: '', boxes: '', analysis: '' }) }),
      { upsert: true },
    );
    expect(pushEventStats).not.toHaveBeenCalled();
    expect(ensureFanmassAnalyticsVariables).not.toHaveBeenCalled();
  });

  it('rejects a tombstone whose source identity conflicts with the stored photo', async () => {
    const fake = fakeDb({
      project: null,
      photo: { cameraEventId: 'different-event', cameraPartnerId: CAMERA_PARTNER_ID },
    });
    const { tombstoneFanmassPhotoAnalysis } = await load(fake.db);

    await expect(tombstoneFanmassPhotoAnalysis(EVENT_ID, PHOTO_ID, tombstoneBody()))
      .rejects.toMatchObject({ status: 409, code: 'CAMERA_PHOTO_IDENTITY_MISMATCH' });
    expect(fake.photoCollection.updateOne).not.toHaveBeenCalled();
  });

  it('writes an idempotent no-resurrection tombstone when both event and photo result are already absent', async () => {
    const fake = fakeDb({ project: null, photo: null });
    const { tombstoneFanmassPhotoAnalysis, pushEventStats } = await load(fake.db);

    const result = await tombstoneFanmassPhotoAnalysis(EVENT_ID, PHOTO_ID, tombstoneBody());

    expect(result.status).toBe('deleted');
    expect(fake.photoCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(pushEventStats).not.toHaveBeenCalled();
  });
});
