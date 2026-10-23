import { isPhotoAnalysisWriteStale, tombstoneFanmassPhotoAnalysisForErasure } from '@/lib/fanmassPhotoAnalyses';

describe('photo analytics deletion fence', () => {
  it('does not let a later generation resurrect a tombstoned event/photo pair', () => {
    expect(isPhotoAnalysisWriteStale(
      { analysisGeneration: 2, sourceRevision: 'old', tombstone: true },
      { analysisGeneration: 999, sourceRevision: 'new' },
    )).toBe(true);
  });

  it('accepts a newer generation while the photo is not tombstoned', () => {
    expect(isPhotoAnalysisWriteStale(
      { analysisGeneration: 2, sourceRevision: 'old', tombstone: false },
      { analysisGeneration: 3, sourceRevision: 'new' },
    )).toBe(false);
  });

  it('treats a different revision at the same generation as stale', () => {
    expect(isPhotoAnalysisWriteStale(
      { analysisGeneration: 3, sourceRevision: 'stored', tombstone: false },
      { analysisGeneration: 3, sourceRevision: 'different' },
    )).toBe(true);
  });
});

describe('exact-photo privacy erasure tombstone', () => {
  it('stores an irreversible tombstone and clears all result and review content', async () => {
    const photoCollection = {
      createIndex: jest.fn().mockResolvedValue('index'),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const projects = { findOne: jest.fn().mockResolvedValue({
      externalRefs: { camera: { eventId: 'camera-event-1' } },
      partner1Id: '507f1f77bcf86cd799439011',
    }) };
    const partners = { findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) };
    const db = {
      collection: jest.fn((name: string) => name === 'projects' ? projects : name === 'partners' ? partners : photoCollection),
    };
    const rebuildSummary = jest.fn().mockResolvedValue({});
    const result = await tombstoneFanmassPhotoAnalysisForErasure({
      messmassEventId: '507f1f77bcf86cd799439012',
      cameraPartnerId: 'camera-partner-1',
      cameraEventId: 'camera-event-1',
      cameraPhotoId: '507f1f77bcf86cd799439013',
      requestId: 'f51e6124-13a3-46ec-b3f8-c9bac50f6bd5',
    }, {
      getDb: jest.fn().mockResolvedValue(db) as never,
      now: () => '2026-10-23T12:00:00.000Z',
      rebuildSummary,
    });

    expect(result).toEqual({ status: 'deleted', receivedAt: '2026-10-23T12:00:00.000Z' });
    expect(photoCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.any(String) }),
      expect.objectContaining({
        $set: expect.objectContaining({ tombstone: true, status: 'deleted', cameraPhotoId: '507f1f77bcf86cd799439013' }),
        $unset: expect.objectContaining({ boxes: '', analysis: '', humanReview: '', summary: '' }),
      }),
      { upsert: true },
    );
    expect(rebuildSummary).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
  });
});
