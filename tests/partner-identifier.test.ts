import { ObjectId } from 'mongodb';
import { findPartnerByIdentifier, isUuidV4 } from '@/lib/partnerIdentifier';

function createDb(findOneImpl: (query: Record<string, unknown>) => Promise<unknown>) {
  return {
    collection: jest.fn(() => ({
      findOne: jest.fn(findOneImpl),
    })),
  };
}

describe('partner identifier resolution', () => {
  it('recognizes UUID v4 identifiers and rejects legacy slugs', () => {
    expect(isUuidV4('11329474-28a3-4089-8d28-1938689339a1')).toBe(true);
    expect(isUuidV4('mtk-budapest')).toBe(false);
  });

  it('resolves a partner by ObjectId when the identifier is a database id', async () => {
    const partner = { _id: new ObjectId(), name: 'MTK Budapest' };
    const db = createDb(async (query) => {
      if (query._id) {
        return partner;
      }
      return null;
    });

    const result = await findPartnerByIdentifier(db as any, partner._id.toString());
    expect(result).toBe(partner);
  });

  it('resolves a partner by legacy viewSlug when the identifier is not UUID-based', async () => {
    const partner = { _id: new ObjectId(), name: 'Zalaegerszegi TE FC', viewSlug: 'zte-football-club' };
    const db = createDb(async (query) => {
      if (query.viewSlug === 'zte-football-club') {
        return partner;
      }
      return null;
    });

    const result = await findPartnerByIdentifier(db as any, 'zte-football-club');
    expect(result).toBe(partner);
  });

  it('falls back to viewSlug lookup when an ObjectId-like identifier is not a real _id match', async () => {
    const hexSlug = '507f1f77bcf86cd799439011';
    const partner = { _id: new ObjectId(), name: 'Hex Slug Partner', viewSlug: hexSlug };
    const db = createDb(async (query) => {
      if (query._id) {
        return null;
      }
      if (query.viewSlug === hexSlug) {
        return partner;
      }
      return null;
    });

    const result = await findPartnerByIdentifier(db as any, hexSlug);
    expect(result).toBe(partner);
  });
});
