import { ObjectId, type Db } from 'mongodb';
import { randomUUID } from 'crypto';

const PARTNERS_COLLECTION = 'partners';

export function isUuidV4(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function getCanonicalPartnerSlug(partner: { _id?: ObjectId | string; viewSlug?: string | null }): string {
  if (typeof partner.viewSlug === 'string' && partner.viewSlug.trim() !== '') {
    return partner.viewSlug.trim();
  }

  if (partner._id instanceof ObjectId) {
    return partner._id.toString();
  }

  return String(partner._id || '').trim();
}

export async function resolvePartnerIdentifier(db: Db, identifier: string) {
  if (!identifier.trim()) {
    return null;
  }

  if (ObjectId.isValid(identifier)) {
    const byId = await db.collection(PARTNERS_COLLECTION).findOne({ _id: new ObjectId(identifier) });
    if (byId) {
      return {
        partner: byId,
        canonicalSlug: getCanonicalPartnerSlug(byId as any),
        matchedBy: '_id' as const,
      };
    }
  }

  const byViewSlug = await db.collection(PARTNERS_COLLECTION).findOne({ viewSlug: identifier });
  if (byViewSlug) {
    return {
      partner: byViewSlug,
      canonicalSlug: getCanonicalPartnerSlug(byViewSlug as any),
      matchedBy: 'viewSlug' as const,
    };
  }

  const byLegacyViewSlug = await db.collection(PARTNERS_COLLECTION).findOne({ legacyViewSlugs: identifier });
  if (byLegacyViewSlug) {
    return {
      partner: byLegacyViewSlug,
      canonicalSlug: getCanonicalPartnerSlug(byLegacyViewSlug as any),
      matchedBy: 'legacyViewSlug' as const,
    };
  }

  return null;
}

export async function findPartnerByIdentifier(db: Db, identifier: string) {
  const resolved = await resolvePartnerIdentifier(db, identifier);
  return resolved?.partner || null;
}

export async function generateUniquePartnerViewSlug(db: Db): Promise<string> {
  let slug = randomUUID();

  while (
    await db.collection(PARTNERS_COLLECTION).findOne(
      {
        $or: [
          { viewSlug: slug },
          { legacyViewSlugs: slug },
        ],
      },
      { projection: { _id: 1 } }
    )
  ) {
    slug = randomUUID();
  }

  return slug;
}
