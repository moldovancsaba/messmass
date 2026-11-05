import { ObjectId } from 'mongodb';

describe('ai_analysis_summaries distributed leasing (INV-003)', () => {
  it('acquires and commits leasing tokens with monotonic versioning during rebuild', async () => {
    const eventId = new ObjectId().toHexString();
    const findOneAndUpdate = jest.fn<any, any[]>(async () => ({ value: { eventId, version: 1 } }));
    const updateOne = jest.fn<any, any[]>(async () => ({ matchedCount: 1, modifiedCount: 1 }));
    const summariesCollection = { findOneAndUpdate, updateOne };

    const photosCollection = {
      find: () => ({
        toArray: async () => [],
      }),
    };

    const projectsCollection = {
      findOne: async () => ({ _id: new ObjectId(eventId), stats: {} }),
    };

    const fakeDb = {
      collection: (name: string) => {
        if (name === 'ai_analysis_summaries') return summariesCollection;
        if (name === 'fanmass_camera_photo_analyses') return photosCollection;
        if (name === 'projects') return projectsCollection;
        if (name === 'variables_metadata') return { find: () => ({ toArray: async () => [] }), insertMany: jest.fn(), bulkWrite: jest.fn(async () => ({})) };
        if (name === 'analytics_variables') return { find: () => ({ toArray: async () => [] }), insertMany: jest.fn() };
        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    jest.doMock('@/lib/fanmassIntegration', () => ({
      __esModule: true,
      getDb: jest.fn(async () => fakeDb),
      nowIso: jest.fn(() => new Date().toISOString()),
    }));

    jest.doMock('@/lib/fanmassMapping', () => ({
      __esModule: true,
      pushEventStats: jest.fn(async () => {}),
    }));

    const { rebuildFanmassPhotoEventSummary } = await import('@/lib/fanmassPhotoAnalyses');

    const result = await rebuildFanmassPhotoEventSummary(eventId);
    expect(result.eventId).toBe(eventId);

    // Verify findOneAndUpdate was called with leasing query
    expect(findOneAndUpdate).toHaveBeenCalled();
    const [leaseFilter, leaseUpdate] = findOneAndUpdate.mock.calls[0];
    expect(leaseFilter.eventId).toBe(eventId);
    expect(leaseUpdate.$set.calculationStatus).toBe('in_progress');
    expect(typeof leaseUpdate.$set.leaseToken).toBe('string');
    expect(leaseUpdate.$inc.version).toBe(1);

    // Verify updateOne completed the calculation with lease release and version increment
    expect(updateOne).toHaveBeenCalled();
    const [commitFilter, commitUpdate] = updateOne.mock.calls[0];
    expect(commitFilter.eventId).toBe(eventId);
    expect(commitUpdate.$set.calculationStatus).toBe('completed');
    expect(typeof commitUpdate.$set.leaseToken).toBe('string');
    expect(commitUpdate.$inc.version).toBe(1);
  });
});
