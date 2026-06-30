import { ObjectId, type Db } from 'mongodb';

const PARTNERS_COLLECTION = 'partners';

export function isUuidV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function findPartnerByIdentifier(db: Db, identifier: string) {
  if (!identifier.trim()) {
    return null;
  }

  if (ObjectId.isValid(identifier)) {
    const byId = await db.collection(PARTNERS_COLLECTION).findOne({ _id: new ObjectId(identifier) });
    if (byId) {
      return byId;
    }
  }

  return db.collection(PARTNERS_COLLECTION).findOne({ viewSlug: identifier });
}
