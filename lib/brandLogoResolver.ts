// lib/brandLogoResolver.ts
// WHAT: Single canonical server-side resolver that enriches InteractiveReportData with official brand SVGs
//       from `brand_assets` and club/federation crests from `partners`.
// WHY: Guarantees every report route (hashtag, filter, global, partner, event, organization, and classic)
//      uses the exact same brand and club logo set immediately upon upload or update.

import type { Db } from 'mongodb';
import type { InteractiveReportData } from '@/components/theme/interactive-report/types';
import {
  canonicalizeBrandName,
  canonicalizeClub,
  getBrandCluster,
  isGenericBrandNoise,
  isGenericVisionDescription,
  isSportFranchise,
  isVenue,
  normalizeClubClusterKey,
} from '@/lib/brandEntityClustering';
import { loadCentralizedClubRegistry } from '@/lib/clubLogoResolver';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function partnerLogo(p: any): string | undefined {
  return (
    p?.logoUrl ||
    p?.logo ||
    p?.sportsDb?.strTeamBadge ||
    p?.sportsDb?.badge ||
    undefined
  );
}

function findBestPartner(partners: any[], predicate: (p: any, pLow: string) => boolean): any | null {
  let fallback: any = null;
  for (const p of partners) {
    if (!p?.name) continue;
    if (predicate(p, String(p.name).toLowerCase().trim())) {
      if (partnerLogo(p)) return p;
      if (!fallback) fallback = p;
    }
  }
  return fallback;
}

export function matchClubToPartnerRecord(club: string, partners: any[]): any | null {
  const low = (club || '').toLowerCase().trim();
  if (!low || low === 'n/a' || low === 'none') return null;

  // 1. Exact case-insensitive name match (preferring rows with a logo)
  const exact = findBestPartner(partners, (_p, pLow) => pLow === low);
  if (exact && partnerLogo(exact)) return exact;

  // 2. Hungarian & frequent multi-section club aliases
  if (low.includes('mtk')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('mtk')) || exact;
  }
  if (low.includes('debrecen') || low.includes('dvsc')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('debrecen') || pLow.includes('dvsc')) || exact;
  }
  if (low.includes('nyíregyház') || low.includes('nyiregyhaz') || low.includes('szpari')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('nyíregyház') || pLow.includes('nyiregyhaz')) || exact;
  }
  if (low.includes('dvtk') || low.includes('diósgyőr') || low.includes('diosgyor')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('dvtk') || pLow.includes('diósgyőr')) || exact;
  }
  if (low.includes('veszprém') || low.includes('veszprem')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('veszprém') || pLow.includes('veszprem')) || exact;
  }
  if (low.includes('fehérvár fc') || low.includes('fehervar fc') || low === 'fehérvár' || low.includes('videoton')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('videoton') || pLow.includes('fehérvár fc')) || exact;
  }
  if (low.includes('hydro fehérvár') || low.includes('fehérvár av19') || low.includes('av19') || low.includes('alba volán')) {
    return (
      findBestPartner(partners, (_p, pLow) => pLow.includes('av19')) ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('alba fehérvár')) ||
      exact
    );
  }
  if (low.includes('sopron')) {
    return (
      findBestPartner(partners, (_p, pLow) => pLow.includes('soproni kc')) ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('sopron')) ||
      exact
    );
  }
  if (low.includes('falco')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('falco')) || exact;
  }
  if (low.includes('körmend') || low.includes('kormend')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('körmend') || pLow.includes('kormend')) || exact;
  }
  if (low.includes('szolnok')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('szolnok')) || exact;
  }
  if (low.includes('kaposvár') || low.includes('kaposvar')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('kaposvár') || pLow.includes('kaposvari')) || exact;
  }
  if (low.includes('ose') || low.includes('oroszlány')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('ose lions')) || exact;
  }
  if (low.includes('szeged') || low.includes('pick')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('pick szeged') || pLow.includes('szeged')) || exact;
  }
  if (low.includes('ferencváros') || low.includes('ferencvaros') || low.includes('fradi') || low.includes('ftc')) {
    return (
      findBestPartner(partners, (_p, pLow) => pLow === 'ferencvárosi tc') ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('ferencváros') || pLow.includes('ftc')) ||
      exact
    );
  }
  if (low.includes('újpest') || low.includes('ujpest') || low.includes('ute')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('újpest') || pLow.includes('ujpest')) || exact;
  }
  if (low.includes('honvéd') || low.includes('honved') || low.includes('kispest')) {
    return (
      findBestPartner(partners, (_p, pLow) => pLow.includes('budapest honvéd')) ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('honvéd')) ||
      exact
    );
  }
  if (low.includes('vasas')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('vasas')) || exact;
  }
  if (low.includes('paks')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('paksi fc') || pLow.includes('paks')) || exact;
  }
  if (low.includes('puskás') || low.includes('puskas')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('puskás')) || exact;
  }
  if (low.includes('kecskemét') || low.includes('kecskemet') || low === 'kte') {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('kecskeméti te') || pLow.includes('kecskemét')) || exact;
  }
  if (low.includes('kisvárda') || low.includes('kisvarda')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('kisvárda fc') || pLow.includes('kisvárda')) || exact;
  }
  if (low.includes('zalaegerszeg') || low.includes('zte')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('zalaegerszeg') || pLow.includes('zte')) || exact;
  }
  if (low.includes('balatonfüred') || low.includes('balatonfured')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('balatonfüred')) || exact;
  }
  if (low.includes('tatabánya') || low.includes('tatabanya')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('tatabánya')) || exact;
  }
  if (low.includes('békéscsaba') || low.includes('bekescsaba')) {
    return findBestPartner(partners, (_p, pLow) => pLow.includes('békéscsaba')) || exact;
  }
  if (low.includes('barcelona') || low === 'barça' || low === 'barca' || low === 'fc barcelona') {
    return findBestPartner(partners, (_p, pLow) => pLow === 'barça' || pLow.includes('barcelona')) || exact;
  }
  if (low.includes('eto') || low.includes('győr') || low.includes('gyor')) {
    if (low.includes('audi') || low.includes('kc') || low.includes('kézi') || low.includes('kezi') || low.includes('handball')) {
      return findBestPartner(partners, (_p, pLow) => pLow.includes('audi eto')) || exact;
    }
    if (low.includes('uni') || low.includes('kosár')) {
      return findBestPartner(partners, (_p, pLow) => pLow.includes('uni győr')) || exact;
    }
    if (low.includes('fc') || low.includes('labdarúg') || low.includes('foci')) {
      return findBestPartner(partners, (_p, pLow) => pLow.includes('eto fc')) || exact;
    }
    return (
      findBestPartner(partners, (_p, pLow) => pLow.includes('audi eto')) ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('eto fc')) ||
      findBestPartner(partners, (_p, pLow) => pLow.includes('eto') || pLow.includes('győr')) ||
      exact
    );
  }

  // 3. Normalized cluster key match (handles Arsenal vs Arsenal FC, Juventus vs Juventus FC, etc.)
  const normKey = normalizeClubClusterKey(club);
  if (normKey.length >= 3) {
    const byNorm = findBestPartner(partners, (p) => normalizeClubClusterKey(p.name) === normKey);
    if (byNorm) return byNorm;
  }

  return exact;
}

export async function enrichInteractiveReportLogos(
  db: Pick<Db, 'collection'> | null | undefined,
  data: InteractiveReportData
): Promise<InteractiveReportData> {
  if (!db || typeof db.collection !== 'function' || !data?.vision?.aggregates) {
    return data;
  }

  const [brandAssets, canonicalMappings, partners, clubRegistry] = await Promise.all([
    db.collection('brand_assets').find({}).toArray().catch(() => []),
    db.collection('brand_canonical_mappings').find({}).toArray().catch(() => []),
    db
      .collection('partners')
      .find(
        {},
        {
          projection: {
            name: 1,
            logoUrl: 1,
            logo: 1,
            viewSlug: 1,
            emoji: 1,
            sportsDb: 1,
            categorizedHashtags: 1,
          },
        }
      )
      .toArray()
      .catch(() => []),
    loadCentralizedClubRegistry(db),
  ]);

  const brandMap = new Map<string, any>();
  for (const asset of brandAssets) {
    if (asset.canonicalSlug) brandMap.set(String(asset.canonicalSlug).toLowerCase().trim(), asset);
    if (asset.name) {
      const nLow = String(asset.name).toLowerCase().trim();
      brandMap.set(nLow, asset);
      brandMap.set(slugify(nLow), asset);
    }
    if (Array.isArray(asset.aliases)) {
      for (const a of asset.aliases) {
        const aLow = String(a).toLowerCase().trim();
        if (aLow) {
          brandMap.set(aLow, asset);
          brandMap.set(slugify(aLow), asset);
        }
      }
    }
  }
  for (const m of canonicalMappings) {
    const alias = String(m.alias || '').toLowerCase().trim();
    const targetKey = String(m.canonicalSlug || m.canonicalName || '').toLowerCase().trim();
    const asset = brandMap.get(targetKey) || brandMap.get(slugify(targetKey));
    if (alias && asset && !brandMap.has(alias)) {
      brandMap.set(alias, asset);
      brandMap.set(slugify(alias), asset);
    }
  }

  const resolveBrandAsset = (rawBrand: string) => {
    const norm = (rawBrand || '').toLowerCase().trim();
    const canonical = canonicalizeBrandName(rawBrand).toLowerCase().trim();
    return (
      brandMap.get(norm) ||
      brandMap.get(slugify(norm)) ||
      brandMap.get(canonical) ||
      brandMap.get(slugify(canonical)) ||
      null
    );
  };

  // Enrich & deduplicate topBrands
  const mergedBrandsMap = new Map<string, any>();
  for (const b of data.vision.aggregates.topBrands || []) {
    if (!b?.brand || b.count <= 0) continue;
    if (isSportFranchise(b.brand) || isVenue(b.brand) || isGenericBrandNoise(b.brand)) continue;
    const match = resolveBrandAsset(b.brand);
    const displayBrand = match?.name || canonicalizeBrandName(b.brand);
    if (isGenericBrandNoise(displayBrand)) continue;
    const key = displayBrand.toLowerCase().trim();
    const cluster = getBrandCluster(displayBrand);
    const existing = mergedBrandsMap.get(key);
    const logoUrl = match?.logoUrl || b.logoUrl || undefined;
    const darkLogoUrl = match?.darkLogoUrl || b.darkLogoUrl || undefined;
    if (existing) {
      existing.count += b.count;
      if (!existing.logoUrl && logoUrl) existing.logoUrl = logoUrl;
      if (!existing.darkLogoUrl && darkLogoUrl) existing.darkLogoUrl = darkLogoUrl;
    } else {
      mergedBrandsMap.set(key, {
        ...b,
        brand: displayBrand,
        count: b.count,
        logoUrl,
        darkLogoUrl,
        category: match?.category || b.category || cluster.label,
        accentColor: match?.accentColor || b.accentColor || undefined,
      });
    }
  }
  const enrichedBrands = Array.from(mergedBrandsMap.values()).sort((a, b) => b.count - a.count);

  // Enrich & deduplicate topClubs using centralized Club Logos registry (`club_assets` + `partners`)
  const clubEntityMap = new Map<string, any>();
  const partnerIdToKey = new Map<string, string>();
  for (const c of data.vision.aggregates.topClubs || []) {
    if (!c?.club || c.count <= 0) continue;
    if (isGenericVisionDescription(c.club)) continue;
    const clubAssetHit = clubRegistry.resolveAssetByName(c.club);
    const canonical = canonicalizeClub(clubAssetHit?.name || c.club);
    if (!canonical) continue;

    const matched =
      matchClubToPartnerRecord(canonical.canonicalName, partners) ||
      matchClubToPartnerRecord(c.club, partners);

    // Verified club gate: require match in SPORT_FRANCHISES_DIRECTORY, centralized club_assets, or partners
    const isKnownVerifiedClub = Boolean(
      canonical.franchise ||
      clubAssetHit ||
      matched ||
      clubRegistry.knownClubKeys.has(canonical.canonicalName.toLowerCase().trim())
    );
    if (!isKnownVerifiedClub) continue;

    const resolvedClubAsset = clubAssetHit || clubRegistry.resolveAssetByName(canonical.canonicalName);
    const partnerId = matched?._id
      ? String(matched._id)
      : resolvedClubAsset?.partnerId
        ? String(resolvedClubAsset.partnerId)
        : c.partnerId;
    const partnerName = matched?.name || c.partnerName || undefined;
    const logoUrl =
      resolvedClubAsset?.logoUrl ||
      partnerLogo(matched) ||
      c.logoUrl ||
      undefined;
    const sport =
      c.sport ||
      canonical.franchise?.sport ||
      resolvedClubAsset?.sport ||
      matched?.sportsDb?.strSport ||
      (matched?.categorizedHashtags?.sport?.[0]
        ? matched.categorizedHashtags.sport[0].charAt(0).toUpperCase() +
          matched.categorizedHashtags.sport[0].slice(1)
        : undefined);

    const displayClubName = canonical.franchise
      ? canonical.canonicalName
      : resolvedClubAsset?.name || canonical.canonicalName;
    const canonicalKey = (partnerName || displayClubName).toLowerCase().trim();
    const targetKey = partnerId && partnerIdToKey.has(partnerId) ? partnerIdToKey.get(partnerId)! : canonicalKey;
    const existing = clubEntityMap.get(targetKey);
    if (existing) {
      existing.count += c.count;
      if (!existing.logoUrl && logoUrl) existing.logoUrl = logoUrl;
      if (!existing.partnerId && partnerId) existing.partnerId = partnerId;
      if (!existing.partnerName && partnerName) existing.partnerName = partnerName;
      if (!existing.partnerSlug && (matched?.viewSlug || c.partnerSlug)) {
        existing.partnerSlug = matched?.viewSlug || c.partnerSlug;
      }
      if (!existing.homeVenue && (matched?.sportsDb?.strStadium || c.homeVenue)) {
        existing.homeVenue = matched?.sportsDb?.strStadium || c.homeVenue;
      }
    } else {
      clubEntityMap.set(targetKey, {
        ...c,
        club: displayClubName,
        count: c.count,
        logoUrl,
        partnerId,
        partnerSlug: matched?.viewSlug || c.partnerSlug || undefined,
        partnerName,
        sport,
        homeVenue: matched?.sportsDb?.strStadium || c.homeVenue || undefined,
        venueCapacity: matched?.sportsDb?.intStadiumCapacity || matched?.sportsDb?.venueCapacity || c.venueCapacity || undefined,
        website: matched?.sportsDb?.strWebsite || matched?.sportsDb?.website || c.website || undefined,
      });
      if (partnerId) partnerIdToKey.set(partnerId, targetKey);
    }
  }
  const enrichedClubs = Array.from(clubEntityMap.values()).sort((a, b) => b.count - a.count);

  // Enrich sportsBreakdown[*].topBrands
  const rawBreakdown = data.vision.aggregates.sportsBreakdown || {};
  const enrichedBreakdown: Record<string, any> = {};
  for (const [sKey, sVal] of Object.entries(rawBreakdown)) {
    const valObj = sVal as any;
    enrichedBreakdown[sKey] = {
      ...valObj,
      topBrands: (valObj?.topBrands || [])
        .filter((b: any) => b?.brand && !isSportFranchise(b.brand) && !isVenue(b.brand) && !isGenericBrandNoise(b.brand))
        .map((b: any) => {
          const match = resolveBrandAsset(b.brand);
          return {
            ...b,
            brand: match?.name || canonicalizeBrandName(b.brand),
            logoUrl: match?.logoUrl || b.logoUrl || undefined,
          };
        }),
    };
  }

  const resolvedHeaderLogo =
    data.partner?.logoUrl ||
    clubRegistry.resolveLogo({
      partnerId: data.partner?.id || null,
      organizationId: data.scope?.type === 'organization' ? data.scope.id : null,
      name: data.partner?.name || data.scope?.name || null,
      slug: data.partner?.viewSlug || data.scope?.id || null,
    }) ||
    (data.partner?.name ? resolveBrandAsset(data.partner.name)?.logoUrl : undefined);

  return {
    ...data,
    ...(data.partner && resolvedHeaderLogo && !data.partner.logoUrl
      ? { partner: { ...data.partner, logoUrl: resolvedHeaderLogo } }
      : {}),
    vision: {
      ...data.vision,
      aggregates: {
        ...data.vision.aggregates,
        topBrands: enrichedBrands,
        topClubs: enrichedClubs,
        sportsBreakdown: enrichedBreakdown,
      },
    },
  };
}
