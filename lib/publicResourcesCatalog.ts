// lib/publicResourcesCatalog.ts
// WHAT: Read-only server-side catalog loader for the public `/resources` pages
//       (`/resources`, `/resources/brands`, `/resources/partners`, `/resources/icons`).
// WHY: Allows external partners to inspect and download their official stored logos and
//      allows internal teams to browse and download verified brand logos, partner crests,
//      and system icons without exposing any edit or mutation controls.

import { getDb } from '@/lib/db';
import { adminNavSections } from '@/lib/adminNavigation';
import { slugifyClub } from '@/lib/clubLogoResolver';
import { resolveSportIcon } from '@/lib/sportIcons';

export type AssetFormat = 'SVG' | 'PNG' | 'WEBP' | 'JPG' | 'OTHER' | 'MISSING';

export interface PublicBrandResource {
  slug: string;
  name: string;
  category: string;
  logoUrl: string;
  darkLogoUrl?: string;
  format: AssetFormat;
  aliases: string[];
}

export interface PublicPartnerResource {
  slug: string;
  name: string;
  entityKind: 'club' | 'national_team' | 'federation';
  sport: string | null;
  country: string | null;
  emoji: string;
  logoUrl: string;
  darkLogoUrl?: string;
  format: AssetFormat;
}

export type PublicIconDomain =
  | 'sport'
  | 'competition'
  | 'chart'
  | 'property'
  | 'group'
  | 'clicker'
  | 'category'
  | 'navigation';

export interface PublicIconResource {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  domain: PublicIconDomain;
  icon: string | null;
  emoji: string | null;
  logoUrl?: string;
}

const NON_CLUB_PARTNER_SLUGS = new Set([
  'mr-vegas',
  'szerencsejatek-zrt',
  'szerencsejatek-zrt-tippmix',
  'mol',
  'mol-group',
  'mol-group-sports-sponsorships',
  'seyu',
  'messmass',
  'messmass-com',
  'save-the-world',
  'one-x-plazs',
  'halott-penz',
  'bagossy-brothers-company',
  'carson-coma',
  'azariah',
  'under-armour',
  'team-travel',
]);

const CANONICAL_SPORTS: Array<{ name: string; icon: string }> = [
  { name: 'Football / Soccer', icon: 'sports_soccer' },
  { name: 'Basketball & 3x3', icon: 'sports_basketball' },
  { name: 'Ice Hockey', icon: 'sports_hockey' },
  { name: 'Handball', icon: 'sports_handball' },
  { name: 'Darts', icon: 'gps_fixed' },
  { name: 'Motorsport (Auto / F1)', icon: 'sports_motorsports' },
  { name: 'MotoGP / Motorcycle', icon: 'two_wheeler' },
  { name: 'Volleyball', icon: 'sports_volleyball' },
  { name: 'Water Polo', icon: 'pool' },
  { name: 'Swimming & Aquatics', icon: 'pool' },
  { name: 'Artistic Swimming', icon: 'water' },
  { name: 'Karate & Martial Arts', icon: 'sports_martial_arts' },
  { name: 'Tennis & Pickleball', icon: 'sports_tennis' },
  { name: 'Live Music & Concerts', icon: 'music_note' },
  { name: 'Multi-Sport', icon: 'emoji_events' },
];

export function detectAssetFormat(url?: string | null): AssetFormat {
  if (!url || !String(url).trim()) return 'MISSING';
  const clean = String(url).trim().toLowerCase().split('?')[0];
  if (clean.startsWith('data:image/svg') || clean.endsWith('.svg')) return 'SVG';
  if (clean.startsWith('data:image/png') || clean.endsWith('.png')) return 'PNG';
  if (clean.startsWith('data:image/webp') || clean.endsWith('.webp')) return 'WEBP';
  if (clean.startsWith('data:image/jpeg') || clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'JPG';
  return 'OTHER';
}

function normalizeMaterialIcon(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!/^[a-z0-9_]{2,48}$/.test(cleaned)) return null;
  return cleaned;
}

export async function loadPublicBrandsCatalog(): Promise<PublicBrandResource[]> {
  const db = await getDb();
  const [brandAssets, orgs, partners] = await Promise.all([
    db.collection('brand_assets').find({ isActive: { $ne: false } }).sort({ name: 1 }).toArray(),
    db
      .collection('organizations')
      .find({ slug: { $in: ['mol-group-sports-sponsorships', 'szerencsejatek-zrt'] } })
      .toArray(),
    db
      .collection('partners')
      .find({ name: { $in: ['One x Plazs'] } })
      .toArray(),
  ]);

  const bySlug = new Map<string, PublicBrandResource>();

  for (const b of brandAssets) {
    const logoUrl = String(b.logoUrl || '').trim();
    if (!logoUrl) continue;
    const slug = String(b.canonicalSlug || slugifyClub(b.name || '')).trim();
    if (!slug) continue;
    bySlug.set(slug, {
      slug,
      name: String(b.name || slug),
      category: String(b.category || 'general'),
      logoUrl,
      darkLogoUrl: b.darkLogoUrl ? String(b.darkLogoUrl) : undefined,
      format: detectAssetFormat(logoUrl),
      aliases: Array.isArray(b.aliases) ? b.aliases.map(String) : [],
    });
  }

  for (const o of orgs) {
    const logoUrl = String(o.logoUrl || o.metadata?.logoUrl || '').trim();
    if (!logoUrl) continue;
    const slug = String(o.slug || slugifyClub(o.name || '')).trim();
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      slug,
      name: String(o.name || slug),
      category: 'corporate_sponsor',
      logoUrl,
      format: detectAssetFormat(logoUrl),
      aliases: [slug],
    });
  }

  for (const p of partners) {
    const logoUrl = String(p.logoUrl || '').trim();
    if (!logoUrl) continue;
    const slug = slugifyClub(p.name || '');
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      slug,
      name: String(p.name || slug),
      category: 'event_partner',
      logoUrl,
      format: detectAssetFormat(logoUrl),
      aliases: [slug],
    });
  }

  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadPublicPartnersCatalog(): Promise<PublicPartnerResource[]> {
  const db = await getDb();
  const [clubAssets, partners, orgs, mappings] = await Promise.all([
    db.collection('club_assets').find({ isActive: { $ne: false } }).sort({ name: 1 }).toArray(),
    db
      .collection('partners')
      .find({}, { projection: { name: 1, logoUrl: 1, emoji: 1, partnerKind: 1, sportsDb: 1 } })
      .sort({ name: 1 })
      .toArray(),
    db
      .collection('organizations')
      .find({}, { projection: { name: 1, slug: 1, logoUrl: 1, emoji: 1, metadata: 1 } })
      .sort({ name: 1 })
      .toArray(),
    db.collection('club_canonical_mappings').find({}).toArray(),
  ]);

  const mappedAliasLowers = new Set<string>();
  for (const m of mappings) {
    if (m.alias && m.targetClub && String(m.alias).toLowerCase().trim() !== String(m.targetClub).toLowerCase().trim()) {
      mappedAliasLowers.add(String(m.alias).toLowerCase().trim());
    }
  }

  const bySlug = new Map<string, PublicPartnerResource>();

  for (const ca of clubAssets) {
    const slug = String(ca.canonicalSlug || slugifyClub(ca.name || '')).trim();
    if (!slug || NON_CLUB_PARTNER_SLUGS.has(slug)) continue;
    const logoUrl = String(ca.logoUrl || '').trim();
    if (!logoUrl) continue;
    const sport = ca.sport ? String(ca.sport) : null;
    bySlug.set(slug, {
      slug,
      name: String(ca.name || slug),
      entityKind: (ca.entityKind as 'club' | 'national_team' | 'federation') || 'club',
      sport,
      country: ca.country ? String(ca.country) : null,
      emoji: String(ca.emoji || resolveSportIcon(sport, '🛡️')),
      logoUrl,
      darkLogoUrl: ca.darkLogoUrl ? String(ca.darkLogoUrl) : undefined,
      format: detectAssetFormat(logoUrl),
    });
  }

  for (const p of partners) {
    const pNameLower = String(p.name || '').toLowerCase().trim();
    if (mappedAliasLowers.has(pNameLower)) continue;
    const slug = slugifyClub(p.name || '');
    if (!slug || NON_CLUB_PARTNER_SLUGS.has(slug)) continue;
    if (String(p.partnerKind || '').toLowerCase() === 'sponsor') continue;
    const logoUrl = String(p.logoUrl || '').trim();
    if (!logoUrl) continue;
    const existing = bySlug.get(slug);
    if (!existing) {
      const sport = p.sportsDb?.strSport ? String(p.sportsDb.strSport) : null;
      bySlug.set(slug, {
        slug,
        name: String(p.name || slug),
        entityKind: p.partnerKind === 'federation' ? 'federation' : 'club',
        sport,
        country: p.sportsDb?.strCountry ? String(p.sportsDb.strCountry) : null,
        emoji: String(p.emoji || resolveSportIcon(sport, '🛡️')),
        logoUrl,
        format: detectAssetFormat(logoUrl),
      });
    } else if (!existing.country && p.sportsDb?.strCountry) {
      existing.country = String(p.sportsDb.strCountry);
    }
  }

  for (const o of orgs) {
    const slug = String(o.slug || slugifyClub(o.name || '')).trim();
    if (!slug || NON_CLUB_PARTNER_SLUGS.has(slug)) continue;
    const logoUrl = String(o.logoUrl || o.metadata?.logoUrl || '').trim();
    if (!logoUrl || bySlug.has(slug)) continue;
    bySlug.set(slug, {
      slug,
      name: String(o.name || slug),
      entityKind: 'federation',
      sport: null,
      country: null,
      emoji: String(o.emoji || o.metadata?.emoji || '🏆'),
      logoUrl,
      format: detectAssetFormat(logoUrl),
    });
  }

  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadPublicIconsCatalog(): Promise<PublicIconResource[]> {
  const db = await getDb();
  const [charts, vars, groups, sets, comps, categories] = await Promise.all([
    db.collection('chart_configurations').find({}).sort({ title: 1 }).toArray(),
    db.collection('variables_metadata').find({}).sort({ category: 1, label: 1 }).toArray(),
    db.collection('variables_groups').find({}).sort({ groupOrder: 1 }).toArray(),
    db.collection('clickerSets').find({}).sort({ name: 1 }).toArray(),
    db.collection('competitions').find({}).sort({ name: 1 }).toArray(),
    db.collection('hashtag_categories').find({}).sort({ order: 1 }).toArray(),
  ]);

  const items: PublicIconResource[] = [];

  // 1. Sports
  for (const sp of CANONICAL_SPORTS) {
    const slug = slugifyClub(sp.name);
    items.push({
      id: `sport:${slug}`,
      slug: `sport-${slug}`,
      title: sp.name,
      subtitle: 'Sport Discipline',
      domain: 'sport',
      icon: sp.icon,
      emoji: resolveSportIcon(sp.name),
    });
  }

  // 2. Competitions
  for (const comp of comps) {
    const slug = slugifyClub(comp.name || '');
    items.push({
      id: `comp:${slug}`,
      slug: `competition-${slug}`,
      title: String(comp.name || slug),
      subtitle: comp.sport ? `Competition • ${comp.sport}` : 'Competition',
      domain: 'competition',
      icon: normalizeMaterialIcon(comp.icon) || 'emoji_events',
      emoji: comp.emoji ? String(comp.emoji) : resolveSportIcon(comp.sport || comp.name || '', '🏆'),
      logoUrl: comp.logoUrl ? String(comp.logoUrl) : undefined,
    });
  }

  // 3. Charts
  for (const ch of charts) {
    const chartId = String(ch.chartId || ch._id);
    items.push({
      id: `chart:${chartId}`,
      slug: `chart-${slugifyClub(chartId)}`,
      title: String(ch.title || chartId),
      subtitle: `Chart (${ch.type || 'kpi'}) • ${chartId}`,
      domain: 'chart',
      icon: normalizeMaterialIcon(ch.icon),
      emoji: ch.emoji ? String(ch.emoji) : null,
    });
  }

  // 4. KYC Properties / Variables
  for (const v of vars) {
    const name = String(v.name || '');
    if (!name) continue;
    items.push({
      id: `var:${name}`,
      slug: `property-${slugifyClub(name)}`,
      title: String(v.label || v.alias || name),
      subtitle: `${v.category || 'Property'} • ${name}`,
      domain: 'property',
      icon: normalizeMaterialIcon(v.icon),
      emoji: v.emoji ? String(v.emoji) : null,
    });
  }

  // 5. Variable Groups
  for (const g of groups) {
    const label = String(g.titleOverride || g.chartId || `Group ${g.groupOrder}`);
    items.push({
      id: `group:${g.groupOrder}`,
      slug: `group-${g.groupOrder}-${slugifyClub(label)}`,
      title: label,
      subtitle: `Clicker Variable Group #${g.groupOrder}`,
      domain: 'group',
      icon: normalizeMaterialIcon(g.icon),
      emoji: g.emoji ? String(g.emoji) : null,
    });
  }

  // 6. Clicker Sets
  for (const s of sets) {
    const slug = slugifyClub(s.name || '');
    items.push({
      id: `clicker:${slug}`,
      slug: `clicker-${slug}`,
      title: String(s.name || slug),
      subtitle: s.isDefault ? 'Clicker Set (Default)' : 'Clicker Set',
      domain: 'clicker',
      icon: normalizeMaterialIcon(s.icon),
      emoji: s.emoji ? String(s.emoji) : null,
    });
  }

  // 7. Hashtag Categories
  for (const cat of categories) {
    const slug = slugifyClub(cat.name || '');
    items.push({
      id: `cat:${slug}`,
      slug: `category-${slug}`,
      title: String(cat.name || slug),
      subtitle: `Hashtag Category • ${cat.color || ''}`,
      domain: 'category',
      icon: normalizeMaterialIcon(cat.icon),
      emoji: cat.emoji ? String(cat.emoji) : null,
    });
  }

  // 8. Admin Navigation Icons
  for (const section of adminNavSections) {
    for (const nav of section.items) {
      const slug = slugifyClub(nav.label);
      items.push({
        id: `nav:${nav.path}`,
        slug: `nav-${slug}`,
        title: nav.label,
        subtitle: `Navigation • ${section.title}`,
        domain: 'navigation',
        icon: normalizeMaterialIcon(nav.icon),
        emoji: null,
      });
    }
  }

  return items;
}

export async function loadPublicResourcesSummary(): Promise<{
  brandsCount: number;
  brandsSvgCount: number;
  partnersCount: number;
  partnersSvgCount: number;
  iconsCount: number;
}> {
  const [brands, partners, icons] = await Promise.all([
    loadPublicBrandsCatalog(),
    loadPublicPartnersCatalog(),
    loadPublicIconsCatalog(),
  ]);
  return {
    brandsCount: brands.length,
    brandsSvgCount: brands.filter((b) => b.format === 'SVG').length,
    partnersCount: partners.length,
    partnersSvgCount: partners.filter((p) => p.format === 'SVG').length,
    iconsCount: icons.length,
  };
}
