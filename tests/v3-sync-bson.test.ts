// tests/v3-sync-bson.test.ts
// WHAT: What the V2 to V3 sync hands to mongoose holds no raw-driver ObjectId inside an untyped field.
// WHY: The V2 collections are read by the raw driver (bson 6) and V3 is written by mongoose (bson 7); an ObjectId of the
//     first inside the second's untyped `metadata` fails the write with "Unsupported BSON version" (49 project syncs and
//     4 partner syncs failed in 7 days of production errors).

import { ObjectId } from 'mongodb';

const connectV3 = jest.fn(async () => undefined);
const entityUpdate = jest.fn(async (_filter: unknown, _update: unknown, _options?: unknown) => ({}));
const activityUpdate = jest.fn(async (_filter: unknown, update: { $set: { organizationId?: unknown } }, _options?: unknown) => ({
  _id: 'activity-1', organizationId: update.$set.organizationId,
}));
const participantUpdate = jest.fn(async () => ({}));
const findById = jest.fn(() => ({ lean: async () => null }));

jest.mock('@/lib/mongoose-v3', () => ({ __esModule: true, default: () => connectV3() }));
jest.mock('@/lib/models/v3/Entity', () => ({ __esModule: true, default: { findById: (...a: unknown[]) => (findById as any)(...a), findOneAndUpdate: (...a: [unknown, unknown, unknown]) => entityUpdate(...a) } }));
jest.mock('@/lib/models/v3/Activity', () => ({ __esModule: true, default: { findOneAndUpdate: (...a: [unknown, any, unknown]) => activityUpdate(...a) } }));
jest.mock('@/lib/models/v3/ActivityParticipant', () => ({ __esModule: true, default: { findOneAndUpdate: () => participantUpdate() } }));

import { plain, syncPartnerToV3Entity, syncProjectToV3Activity } from '@/lib/v3/syncEngine';

/** True when any value in the tree is a bson object (an ObjectId, whatever its version). */
function hasBsonObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if ((value as { _bsontype?: unknown })._bsontype) return true;
  return Object.values(value as Record<string, unknown>).some(hasBsonObject);
}

beforeEach(() => jest.clearAllMocks());

describe('the V2 to V3 sync', () => {
  it('turns ids and dates into plain values and leaves the rest as it is', () => {
    const id = new ObjectId();
    expect(plain({ owner: id, tags: ['a'], n: 3 })).toEqual({ owner: id.toHexString(), tags: ['a'], n: 3 });
    expect(plain(undefined)).toBeUndefined();
  });

  it('writes a project with ObjectIds in its stats and hashtags categories as plain values', async () => {
    const partnerId = new ObjectId();
    await syncProjectToV3Activity({
      _id: new ObjectId(),
      eventName: 'Derby',
      eventDate: '2026-11-01',
      partner1Id: partnerId,
      hashtags: ['derby'],
      categorizedHashtags: { sport: ['football'], owners: [new ObjectId()] },
      stats: { allImages: 10, lastEditor: new ObjectId() },
    });
    expect(activityUpdate).toHaveBeenCalledTimes(1);
    const update = activityUpdate.mock.calls[0][1] as { $set: { metadata: unknown } };
    expect(hasBsonObject(update.$set.metadata)).toBe(false);
    // The typed id is looked up as text, so mongoose casts it itself
    expect(findById).toHaveBeenCalledWith(partnerId.toHexString());
  });

  it('writes a partner with ObjectIds in its tags and sports data as plain values', async () => {
    await syncPartnerToV3Entity({
      _id: new ObjectId(),
      name: 'Club',
      tags: [new ObjectId()],
      sportsDb: { strTeam: 'Club', ref: new ObjectId() },
      footballData: { id: 1, owner: new ObjectId() },
    });
    expect(entityUpdate).toHaveBeenCalledTimes(1);
    const update = entityUpdate.mock.calls[0][1] as { $set: { metadata: unknown } };
    expect(hasBsonObject(update.$set.metadata)).toBe(false);
  });
});
