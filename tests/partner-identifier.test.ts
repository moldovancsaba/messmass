import { ObjectId } from 'mongodb';
import {
  findPartnerByIdentifier,
  generateUniquePartnerViewSlug,
  isUuidV4,
  resolvePartnerIdentifier,
} from '@/lib/partnerIdentifier';

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
    const partner = {
      _id: new ObjectId(),
      name: 'Zalaegerszegi TE FC',
      viewSlug: '11329474-28a3-4089-8d28-1938689339a1',
      legacyViewSlugs: ['zte-football-club'],
    };
    const db = createDb(async (query) => {
      if (query.legacyViewSlugs === 'zte-football-club') {
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

  // F-MM-08: pins the invariant that keeps removePagePassword's resolveCanonicalPageId ->
  // resolvePartnerIdentifier dispatch from ever deleting the wrong partner's password
  // record. A generated viewSlug that happened to be ObjectId-shaped would hit the
  // _id-first branch before the viewSlug branch -- this can only stay unreachable if
  // generation itself never produces that shape.
  it('never generates an ObjectId-shaped viewSlug', async () => {
    const db = createDb(async () => null); // no existing collisions
    for (let i = 0; i < 50; i++) {
      const slug = await generateUniquePartnerViewSlug(db as any);
      expect(ObjectId.isValid(slug)).toBe(false);
    }
  });

  it('resolves a real generated viewSlug via the viewSlug branch, never the _id branch', async () => {
    const db = createDb(async () => null);
    const slug = await generateUniquePartnerViewSlug(db as any);

    const partner = { _id: new ObjectId(), name: 'Generated Slug Partner', viewSlug: slug };
    const idQueries: Record<string, unknown>[] = [];
    const resolveDb = createDb(async (query) => {
      idQueries.push(query);
      if (query.viewSlug === slug) {
        return partner;
      }
      return null;
    });

    const result = await resolvePartnerIdentifier(resolveDb as any, slug);
    expect(result?.matchedBy).toBe('viewSlug');
    expect(idQueries.some((query) => '_id' in query)).toBe(false);
  });
});
