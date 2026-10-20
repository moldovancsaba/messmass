import { ObjectId } from 'mongodb';

jest.mock('../lib/fanmassIntegration', () => ({ getDb: jest.fn() }));
jest.mock('../lib/slugUtils', () => ({ generateProjectSlugs: jest.fn() }));
jest.mock('../lib/dataValidator', () => ({ prepareStatsForAnalytics: jest.fn() }));
jest.mock('../lib/partnerIdentifier', () => ({ generateUniquePartnerViewSlug: jest.fn() }));
jest.mock('../lib/projectStatsUtils', () => ({ addDerivedMetrics: jest.fn() }));
jest.mock('../lib/v3/syncEngine', () => ({ syncPartnerToV3Entity: jest.fn() }));

import { getDb } from '../lib/fanmassIntegration';
import { prepareStatsForAnalytics } from '../lib/dataValidator';
import { generateProjectSlugs } from '../lib/slugUtils';
import { createEvent } from '../lib/fanmassMapping';

describe('createEvent date handling', () => {
  it('preserves an explicitly unknown date instead of inventing today', async () => {
    const inserted: Record<string, unknown>[] = [];
    const collection = {
      insertOne: jest.fn(async (doc: Record<string, unknown>) => {
        inserted.push(doc);
        return { insertedId: new ObjectId() };
      }),
    };
    const db = { collection: jest.fn(() => collection) };
    jest.mocked(getDb).mockResolvedValue(db as never);
    jest.mocked(generateProjectSlugs).mockResolvedValue({ viewSlug: 'view', editSlug: 'edit' });
    jest.mocked(prepareStatsForAnalytics).mockReturnValue({ stats: {} } as never);

    const event = await createEvent({ eventName: 'Take the Pledge', eventDate: null });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).not.toHaveProperty('eventDate');
    expect(event.eventDate).toBeNull();
  });
});
