// lib/clubLogoResolver.ts
// WHAT: Centralized Club, National Team & Federation Logo Registry and Bidirectional Sync Engine.
// WHY: Single source of truth (`club_assets`) powering Club Logos (`/admin/club-logos`), Events,
//      Partners, Organizations, Project Partners, AI Reports, and Classic Reports.

import { ObjectId, type Db } from 'mongodb';
import { normalizeClubClusterKey } from '@/lib/brandEntityClustering';

export type ClubEntityKind = 'club' | 'national_team' | 'federation';

export interface ClubAssetRecord {
  _id?: string | ObjectId;
  name: string;
  canonicalSlug: string;
  aliases: string[];
  logoUrl: string;
  darkLogoUrl?: string;
  entityKind: ClubEntityKind;
  sport?: string | null;
  country?: string | null;
  emoji?: string;
  partnerId?: string | ObjectId | null;
  organizationId?: string | ObjectId | null;
  logoSource?: Record<string, unknown> | null;
  updatedAt?: string;
}

export function slugifyClub(value: string): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CentralizedClubRegistry {
  assets: ClubAssetRecord[];
  byPartnerId: Map<string, ClubAssetRecord>;
  byOrgId: Map<string, ClubAssetRecord>;
  byKey: Map<string, ClubAssetRecord>;
  aliasToTarget: Map<string, string>;
  knownClubKeys: Set<string>;
  resolveLogo: (input: {
    partnerId?: string | ObjectId | null;
    organizationId?: string | ObjectId | null;
    name?: string | null;
    slug?: string | null;
    fallbackUrl?: string | null;
  }) => string | undefined;
  resolveAssetByName: (rawName: string) => ClubAssetRecord | null;
}

export async function loadCentralizedClubRegistry(
  db: Pick<Db, 'collection'>
): Promise<CentralizedClubRegistry> {
  const [rawAssets, partners, orgs, mappings] = await Promise.all([
    db.collection('club_assets').find({ isActive: { $ne: false } }).toArray().catch(() => []),
    db
      .collection('partners')
      .find({}, { projection: { _id: 1, name: 1, logoUrl: 1, logo: 1, emoji: 1, viewSlug: 1, partnerKind: 1, sportsDb: 1 } })
      .toArray()
      .catch(() => []),
    db
      .collection('organizations')
      .find({}, { projection: { _id: 1, name: 1, slug: 1, logoUrl: 1, 'metadata.logoUrl': 1 } })
      .toArray()
      .catch(() => []),
    db.collection('club_canonical_mappings').find({}).toArray().catch(() => []),
  ]);

  const byPartnerId = new Map<string, ClubAssetRecord>();
  const byOrgId = new Map<string, ClubAssetRecord>();
  const byKey = new Map<string, ClubAssetRecord>();
  const aliasToTarget = new Map<string, string>();
  const knownClubKeys = new Set<string>();

  for (const m of mappings) {
    const al = String(m.alias || '').toLowerCase().trim();
    const tgt = String(m.targetClub || '').trim();
    if (al && tgt) {
      aliasToTarget.set(al, tgt);
      knownClubKeys.add(al);
      knownClubKeys.add(tgt.toLowerCase());
    }
  }

  const registerRecord = (rec: ClubAssetRecord, preferExistingLogo = true) => {
    const keys = [
      rec.canonicalSlug,
      slugifyClub(rec.name),
      rec.name.toLowerCase().trim(),
      normalizeClubClusterKey(rec.name),
      ...(rec.aliases || []).flatMap((a) => [a.toLowerCase().trim(), slugifyClub(a), normalizeClubClusterKey(a)]),
    ].filter(Boolean);

    for (const k of keys) {
      knownClubKeys.add(k);
      const cur = byKey.get(k);
      if (!cur || (!cur.logoUrl && rec.logoUrl) || (!preferExistingLogo && rec.logoUrl)) {
        byKey.set(k, rec);
      }
    }
    if (rec.partnerId) {
      const pid = String(rec.partnerId);
      const cur = byPartnerId.get(pid);
      if (!cur || (!cur.logoUrl && rec.logoUrl) || (!preferExistingLogo && rec.logoUrl)) {
        byPartnerId.set(pid, rec);
      }
    }
    if (rec.organizationId) {
      const oid = String(rec.organizationId);
      const cur = byOrgId.get(oid);
      if (!cur || (!cur.logoUrl && rec.logoUrl) || (!preferExistingLogo && rec.logoUrl)) {
        byOrgId.set(oid, rec);
      }
    }
  };

  const assets: ClubAssetRecord[] = rawAssets.map((a: any) => ({
    _id: a._id ? String(a._id) : undefined,
    name: String(a.name || ''),
    canonicalSlug: String(a.canonicalSlug || slugifyClub(a.name || '')),
    aliases: Array.isArray(a.aliases) ? a.aliases.map(String) : [],
    logoUrl: String(a.logoUrl || ''),
    darkLogoUrl: a.darkLogoUrl ? String(a.darkLogoUrl) : undefined,
    entityKind: (a.entityKind as ClubEntityKind) || 'club',
    sport: a.sport || null,
    country: a.country || null,
    emoji: a.emoji || '🏟️',
    partnerId: a.partnerId ? String(a.partnerId) : null,
    organizationId: a.organizationId ? String(a.organizationId) : null,
    logoSource: a.logoSource || null,
    updatedAt: a.updatedAt,
  }));

  // Authoritative `club_assets` registered first
  for (const a of assets) {
    registerRecord(a, false);
  }

  // Fallback enrichment from `partners` and `organizations`
  for (const p of partners) {
    if (!p?.name) continue;
    const logo = p.logoUrl || p.logo || p.sportsDb?.strTeamBadge || p.sportsDb?.badge || '';
    registerRecord(
      {
        name: String(p.name),
        canonicalSlug: slugifyClub(p.name),
        aliases: [String(p.name).toLowerCase().trim()],
        logoUrl: String(logo),
        entityKind: p.partnerKind === 'federation' ? 'federation' : 'club',
        sport: p.sportsDb?.strSport || null,
        country: p.sportsDb?.strCountry || null,
        emoji: p.emoji || '🏟️',
        partnerId: String(p._id),
      },
      true
    );
  }

  for (const o of orgs) {
    if (!o?.name) continue;
    const logo = o.logoUrl || o.metadata?.logoUrl || '';
    registerRecord(
      {
        name: String(o.name),
        canonicalSlug: String(o.slug || slugifyClub(o.name)),
        aliases: [String(o.name).toLowerCase().trim(), String(o.slug || '').toLowerCase().trim()].filter(Boolean),
        logoUrl: String(logo),
        entityKind: 'federation',
        organizationId: String(o._id),
      },
      true
    );
  }

  const resolveAssetByName = (rawName: string): ClubAssetRecord | null => {
    const low = String(rawName || '').toLowerCase().trim();
    if (!low) return null;
    const mapped = aliasToTarget.get(low);
    const candidates = [
      ...(mapped ? [mapped.toLowerCase(), slugifyClub(mapped), normalizeClubClusterKey(mapped)] : []),
      low,
      slugifyClub(low),
      normalizeClubClusterKey(low),
    ].filter(Boolean);
    for (const c of candidates) {
      const hit = byKey.get(c);
      if (hit) return hit;
    }
    return null;
  };

  const resolveLogo = (input: {
    partnerId?: string | ObjectId | null;
    organizationId?: string | ObjectId | null;
    name?: string | null;
    slug?: string | null;
    fallbackUrl?: string | null;
  }): string | undefined => {
    if (input.partnerId) {
      const hit = byPartnerId.get(String(input.partnerId));
      if (hit?.logoUrl) return hit.logoUrl;
    }
    if (input.organizationId) {
      const hit = byOrgId.get(String(input.organizationId));
      if (hit?.logoUrl) return hit.logoUrl;
    }
    if (input.slug) {
      const hit = byKey.get(String(input.slug).toLowerCase().trim()) || byKey.get(slugifyClub(input.slug));
      if (hit?.logoUrl) return hit.logoUrl;
    }
    if (input.name) {
      const hit = resolveAssetByName(input.name);
      if (hit?.logoUrl) return hit.logoUrl;
    }
    return input.fallbackUrl || undefined;
  };

  return {
    assets,
    byPartnerId,
    byOrgId,
    byKey,
    aliasToTarget,
    knownClubKeys,
    resolveLogo,
    resolveAssetByName,
  };
}

/**
 * Propagate an updated centralized club logo across matching `partners`, `organizations`,
 * `v3_organizations`, and `v3_entities` via surgical `$set` so every UI surface stays synchronized.
 */
export async function syncClubAssetAcrossEntities(
  db: Db,
  params: {
    name: string;
    canonicalSlug: string;
    logoUrl: string;
    aliases?: string[];
    partnerId?: string | ObjectId | null;
    organizationId?: string | ObjectId | null;
  }
): Promise<{ updatedPartnerIds: string[]; updatedOrgIds: string[] }> {
  if (!params.logoUrl) return { updatedPartnerIds: [], updatedOrgIds: [] };
  const now = new Date().toISOString();
  const updatedPartnerIds: string[] = [];
  const updatedOrgIds: string[] = [];

  const candidateNames = new Set(
    [params.name, ...(params.aliases || [])]
      .map((s) => String(s || '').toLowerCase().trim())
      .filter((s) => s.length >= 2)
  );
  const candidateSlugs = new Set([params.canonicalSlug, slugifyClub(params.name)].filter(Boolean));

  // 1. Match Partners by explicit partnerId or exact case-insensitive name/slug
  const partners = await db.collection('partners').find({}, { projection: { _id: 1, name: 1, viewSlug: 1 } }).toArray();
  const matchedPartnerIds: ObjectId[] = [];
  for (const p of partners) {
    const pid = String(p._id);
    const pLow = String(p.name || '').toLowerCase().trim();
    const pSlug = slugifyClub(p.name || '');
    if (
      (params.partnerId && pid === String(params.partnerId)) ||
      candidateNames.has(pLow) ||
      candidateSlugs.has(pSlug)
    ) {
      matchedPartnerIds.push(p._id);
      updatedPartnerIds.push(pid);
    }
  }

  if (matchedPartnerIds.length > 0) {
    await db.collection('partners').updateMany(
      { _id: { $in: matchedPartnerIds } },
      { $set: { logoUrl: params.logoUrl, updatedAt: now } }
    );
    await db.collection('v3_entities').updateMany(
      { _id: { $in: matchedPartnerIds } },
      { $set: { 'metadata.logoUrl': params.logoUrl, updatedAt: now } }
    ).catch(() => null);
  }

  // 2. Match Organizations by explicit organizationId or exact name/slug
  const orgs = await db.collection('organizations').find({}, { projection: { _id: 1, name: 1, slug: 1 } }).toArray();
  const matchedOrgIds: ObjectId[] = [];
  for (const o of orgs) {
    const oid = String(o._id);
    const oLow = String(o.name || '').toLowerCase().trim();
    const oSlug = String(o.slug || slugifyClub(o.name || '')).toLowerCase().trim();
    if (
      (params.organizationId && oid === String(params.organizationId)) ||
      candidateNames.has(oLow) ||
      candidateSlugs.has(oSlug)
    ) {
      matchedOrgIds.push(o._id);
      updatedOrgIds.push(oid);
    }
  }

  if (matchedOrgIds.length > 0) {
    await db.collection('organizations').updateMany(
      { _id: { $in: matchedOrgIds } },
      { $set: { logoUrl: params.logoUrl, 'metadata.logoUrl': params.logoUrl, updatedAt: now } }
    );
    await db.collection('v3_organizations').updateMany(
      { _id: { $in: matchedOrgIds } },
      { $set: { logoUrl: params.logoUrl, 'metadata.logoUrl': params.logoUrl, updatedAt: now } }
    ).catch(() => null);
  }

  await db.collection('report_snapshots').deleteMany({}).catch(() => null);
  return { updatedPartnerIds, updatedOrgIds };
}
