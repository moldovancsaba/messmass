import type { Db } from 'mongodb';

jest.mock('../lib/cameraClient', () => ({
  cameraConfigured: () => true,
  cameraClient: {},
}));

import { provisionMissingEvents } from '../lib/cameraProvision';

describe('provisionMissingEvents', () => {
  it('finds projects whose Camera event link is absent or empty', async () => {
    let query: Record<string, unknown> | undefined;
    const db = {
      collection: jest.fn(() => ({
        find: jest.fn((filter: Record<string, unknown>) => {
          query = filter;
          return { limit: () => ({ toArray: async () => [] }) };
        }),
      })),
    } as unknown as Db;

    const result = await provisionMissingEvents(db, 20);

    expect(result).toEqual({ provisioned: 0, scanned: 0, failed: 0, failures: [] });
    expect(query).toEqual({
      $and: [
        {
          $or: [
            { 'externalRefs.camera.eventId': { $exists: false } },
            { 'externalRefs.camera.eventId': { $in: [null, ''] } },
            { 'externalRefs.camera.eventId': { $regex: '^\\s*$' } },
          ],
        },
        {
          $or: [
            { partner1Id: { $exists: true } },
            { partnerId: { $exists: true } },
            { partner2Id: { $exists: true } },
            { 'partnerIds.0': { $exists: true } },
          ],
        },
      ],
    });
  });
});
