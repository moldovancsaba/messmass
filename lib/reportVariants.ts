import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { findHashtagsByFilterSlug } from '@/lib/slugUtils';
import {
  ReportPeriodPreset,
  ReportCustomDateRange,
  resolveReportPeriod,
  type ResolvedReportPeriod,
} from '@/lib/reportPeriods';
import { normalizeReportPeriodInput, normalizeReportPeriodUpdate } from '@/lib/reportPeriodValidation';
import { resolveRuntimeReportById, type RuntimeReportResolution } from '@/lib/reportRuntime';
import { findPartnerByIdentifier } from '@/lib/partnerIdentifier';
import {
  applyStatsFieldChanges,
  editorSequenceGuard,
  statsUpdateOperators,
  type EditorSequence,
  type StatsFieldChanges,
} from '@/lib/statsFieldChanges';

export type ReportVariantOwnerType = 'organization' | 'partner' | 'hashtag' | 'filter' | 'global';
export type ReportVariantStatus = 'draft' | 'published' | 'archived';
export type ReportVariantEventScope = 'all' | 'national_games' | 'club_games';

export interface ReportVariantEventFilter {
  competitionTypes?: string[];
  leagueTags?: string[];
  sponsorTags?: string[];
  sportTags?: string[];
  organizationIds?: string[];
  excludeSyntheticRollups?: boolean;
}

export interface ReportVariant {
  _id: string;
  ownerType: ReportVariantOwnerType;
  ownerId: string;
  name: string;
  slug: string;
  isDefault: boolean;
  status: ReportVariantStatus;
  timezone: string;
  periodPreset: ReportPeriodPreset;
  customDateRange: ReportCustomDateRange | null;
  eventScope?: ReportVariantEventScope;
  eventFilter?: ReportVariantEventFilter | null;
  reportTemplateId?: string;
  styleId?: string;
  logoUrl?: string;
  emoji?: string;
  showEmoji?: boolean;
  showMembersList?: boolean;
  showMembersListTitle?: boolean;
  showMembersListDetails?: boolean;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  showOnlyTeam1Events?: boolean;
  statsOverrides: Record<string, unknown>;
  createdFromVariantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationRecord {
  _id: ObjectId;
  name: string;
  metadata?: Record<string, unknown>;
}

interface PartnerRecord {
  _id: ObjectId;
  name: string;
  emoji?: string;
  logoUrl?: string;
  stats?: Record<string, unknown>;
  styleId?: ObjectId | string;
  reportTemplateId?: ObjectId | string;
  showEmoji?: boolean;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  showOnlyTeam1Events?: boolean;
}

export interface ReportVariantBaseSource {
  ownerType: ReportVariantOwnerType;
  ownerId: string;
  ownerName: string;
  timezone: string;
  orgType?: string;
  reportTemplateId?: string;
  styleId?: string;
  logoUrl?: string;
  emoji?: string;
  showEmoji?: boolean;
  showMembersList?: boolean;
  showMembersListTitle?: boolean;
  showMembersListDetails?: boolean;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  showOnlyTeam1Events?: boolean;
  statsOverrides: Record<string, unknown>;
}

export interface ResolvedReportVariant {
  variant: ReportVariant;
  availableVariants: ReportVariant[];
  isVirtualDefault: boolean;
  period: ResolvedReportPeriod;
  runtimeReport: RuntimeReportResolution;
}

const DEFAULT_TIMEZONE = 'Europe/Budapest';

function slugifyVariantName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return normalized || 'report';
}

function normalizeVariantRecord(record: any): ReportVariant {
  return {
    _id: record._id.toString(),
    ownerType: record.ownerType,
    ownerId: record.ownerId,
    name: record.name,
    slug: record.slug,
    isDefault: Boolean(record.isDefault),
    status: (record.status || 'draft') as ReportVariantStatus,
    timezone: record.timezone || DEFAULT_TIMEZONE,
    periodPreset: (record.periodPreset || 'all_time') as ReportPeriodPreset,
    customDateRange: record.customDateRange || null,
    eventScope: record.eventScope || undefined,
    eventFilter: record.eventFilter || null,
    reportTemplateId: record.reportTemplateId ? String(record.reportTemplateId) : undefined,
    styleId: record.styleId ? String(record.styleId) : undefined,
    logoUrl: record.logoUrl,
    emoji: record.emoji,
    showEmoji: record.showEmoji,
    showMembersList: record.showMembersList,
    showMembersListTitle: record.showMembersListTitle,
    showMembersListDetails: record.showMembersListDetails,
    showEventsList: record.showEventsList,
    showEventsListTitle: record.showEventsListTitle,
    showEventsListDetails: record.showEventsListDetails,
    showOnlyTeam1Events: record.showOnlyTeam1Events,
    statsOverrides: record.statsOverrides || {},
    createdFromVariantId: record.createdFromVariantId || null,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

export function getReportVariantPageId(basePageId: string, variantSlug?: string | null): string {
  if (!variantSlug || variantSlug === 'default') return basePageId;
  return `${basePageId}::variant=${variantSlug}`;
}

export function parseReportVariantPageId(pageId: string): { basePageId: string; variantSlug: string | null } {
  const [basePageId, variantPart] = pageId.split('::variant=');
  return {
    basePageId,
    variantSlug: variantPart || null,
  };
}

export async function resolveReportVariantBaseSource(
  db: Db,
  ownerType: ReportVariantOwnerType,
  ownerId: string
): Promise<ReportVariantBaseSource> {
  if (ownerType === 'organization') {
    const organizations = db.collection<OrganizationRecord>('organizations');
    const organization = ObjectId.isValid(ownerId)
      ? (await organizations.findOne({ _id: new ObjectId(ownerId) })) ||
        (await organizations.findOne({ slug: ownerId }))
      : await organizations.findOne({ slug: ownerId });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const metadata = (organization.metadata || {}) as Record<string, unknown>;
    return {
      ownerType,
      ownerId: organization._id.toString(),
      ownerName: organization.name,
      timezone: DEFAULT_TIMEZONE,
      orgType: typeof metadata.orgType === 'string' ? metadata.orgType : undefined,
      reportTemplateId: metadata.reportTemplateId
        ? String(metadata.reportTemplateId)
        : metadata.reportId
          ? String(metadata.reportId)
          : undefined,
      styleId: metadata.styleId ? String(metadata.styleId) : undefined,
      logoUrl: typeof metadata.logoUrl === 'string' ? metadata.logoUrl : undefined,
      emoji: typeof metadata.emoji === 'string' ? metadata.emoji : undefined,
      showEmoji: metadata.showEmoji !== false,
      showMembersList: metadata.showMembersList !== false,
      showMembersListTitle: metadata.showMembersListTitle !== false,
      showMembersListDetails: metadata.showMembersListDetails !== false,
      showEventsList: metadata.showEventsList !== false,
      showEventsListTitle: metadata.showEventsListTitle !== false,
      showEventsListDetails: metadata.showEventsListDetails !== false,
      statsOverrides: (metadata.stats as Record<string, unknown>) || {},
    };
  }

  if (ownerType === 'partner') {
    const partners = db.collection<PartnerRecord>('partners');
    const partner = await findPartnerByIdentifier(db, ownerId) as PartnerRecord | null;

    if (!partner) {
      throw new Error('Partner not found');
    }

    return {
      ownerType,
      ownerId,
      ownerName: partner.name,
      timezone: DEFAULT_TIMEZONE,
      reportTemplateId: partner.reportTemplateId ? String(partner.reportTemplateId) : undefined,
      styleId: partner.styleId ? String(partner.styleId) : undefined,
      logoUrl: partner.logoUrl,
      emoji: partner.emoji,
      showEmoji: partner.showEmoji !== false,
      showEventsList: partner.showEventsList !== false,
      showEventsListTitle: partner.showEventsListTitle !== false,
      showEventsListDetails: partner.showEventsListDetails !== false,
      showOnlyTeam1Events: partner.showOnlyTeam1Events === true,
      statsOverrides: partner.stats || {},
    };
  }

  if (ownerType === 'filter') {
    const filterData = await findHashtagsByFilterSlug(ownerId);
    return {
      ownerType,
      ownerId,
      ownerName: filterData?.hashtags?.length
        ? `Filter: ${filterData.hashtags.map((tag) => `#${tag}`).join(' + ')}`
        : `Filter: ${ownerId}`,
      timezone: DEFAULT_TIMEZONE,
      styleId: filterData?.styleId || undefined,
      statsOverrides: {},
    };
  }

  if (ownerType === 'global') {
    return { ownerType, ownerId, ownerName: 'All data', timezone: DEFAULT_TIMEZONE, statsOverrides: {} };
  }

  return {
    ownerType,
    ownerId,
    ownerName: `#${ownerId}`,
    timezone: DEFAULT_TIMEZONE,
    statsOverrides: {},
  };
}

export function buildVirtualDefaultVariant(baseSource: ReportVariantBaseSource): ReportVariant {
  const isFederation = baseSource.ownerType === 'organization' && baseSource.orgType === 'federation';
  return {
    _id: `virtual-default:${baseSource.ownerType}:${baseSource.ownerId}`,
    ownerType: baseSource.ownerType,
    ownerId: baseSource.ownerId,
    name: isFederation ? 'All Together (National + Club)' : 'DEFAULT',
    slug: 'default',
    isDefault: true,
    status: 'published',
    timezone: baseSource.timezone || DEFAULT_TIMEZONE,
    periodPreset: 'all_time',
    customDateRange: null,
    eventScope: 'all',
    eventFilter: null,
    reportTemplateId: baseSource.reportTemplateId,
    styleId: baseSource.styleId,
    logoUrl: baseSource.logoUrl,
    emoji: baseSource.emoji,
    showEmoji: baseSource.showEmoji,
    showMembersList: baseSource.showMembersList,
    showMembersListTitle: baseSource.showMembersListTitle,
    showMembersListDetails: baseSource.showMembersListDetails,
    showEventsList: baseSource.showEventsList,
    showEventsListTitle: baseSource.showEventsListTitle,
    showEventsListDetails: baseSource.showEventsListDetails,
    showOnlyTeam1Events: baseSource.showOnlyTeam1Events,
    statsOverrides: baseSource.statsOverrides || {},
    createdFromVariantId: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function buildVirtualFederationScopeVariants(baseSource: ReportVariantBaseSource): ReportVariant[] {
  const base = buildVirtualDefaultVariant(baseSource);
  return [
    base,
    {
      ...base,
      _id: `virtual-scope:${baseSource.ownerType}:${baseSource.ownerId}:national-games`,
      name: 'National Games',
      slug: 'national-games',
      isDefault: false,
      eventScope: 'national_games',
    },
    {
      ...base,
      _id: `virtual-scope:${baseSource.ownerType}:${baseSource.ownerId}:club-games`,
      name: 'Club Games',
      slug: 'club-games',
      isDefault: false,
      eventScope: 'club_games',
    },
  ];
}

export async function listReportVariants(
  db: Db,
  ownerType: ReportVariantOwnerType,
  ownerId: string
): Promise<{ baseSource: ReportVariantBaseSource; variants: ReportVariant[] }> {
  const baseSource = await resolveReportVariantBaseSource(db, ownerType, ownerId);
  const collection = db.collection('report_variants');
  const stored = await collection
    .find({ ownerType, ownerId: baseSource.ownerId })
    .sort({ isDefault: -1, createdAt: 1, name: 1 })
    .toArray();

  const variants = stored.map(normalizeVariantRecord);
  const hasStoredDefault = variants.some((variant) => variant.isDefault);
  const merged = hasStoredDefault
    ? [...variants]
    : [buildVirtualDefaultVariant(baseSource), ...variants];

  if (ownerType === 'organization' && baseSource.orgType === 'federation') {
    for (const virtualScope of buildVirtualFederationScopeVariants(baseSource)) {
      if (!merged.some((v) => v.slug === virtualScope.slug)) {
        merged.push(virtualScope);
      }
    }
  } else if (ownerType === 'partner' && ObjectId.isValid(baseSource.ownerId)) {
    const pOid = new ObjectId(baseSource.ownerId);
    const partnerEvents = await db
      .collection('projects')
      .find(
        {
          $or: [
            { partner1: pOid },
            { partner2: pOid },
            { partner1Id: pOid },
            { partner2Id: pOid },
          ],
        },
        { projection: { competitionType: 1, categorizedHashtags: 1 } }
      )
      .toArray();
    const compTypes = new Set(partnerEvents.map((e) => String(e.competitionType || '')).filter(Boolean));
    const sponsors = new Set(
      partnerEvents.flatMap((e) => (e.categorizedHashtags?.sponsor || []) as string[])
    );
    const base = buildVirtualDefaultVariant(baseSource);
    if (compTypes.size > 1) {
      if (compTypes.has('domestic_league') && !merged.some((v) => v.slug === 'domestic-league')) {
        merged.push({
          ...base,
          _id: `virtual-scope:partner:${baseSource.ownerId}:domestic-league`,
          name: 'Domestic League',
          slug: 'domestic-league',
          isDefault: false,
          eventFilter: { competitionTypes: ['domestic_league'] },
        });
      }
      if (compTypes.has('domestic_cup') && !merged.some((v) => v.slug === 'domestic-cup')) {
        merged.push({
          ...base,
          _id: `virtual-scope:partner:${baseSource.ownerId}:domestic-cup`,
          name: 'Domestic Cup',
          slug: 'domestic-cup',
          isDefault: false,
          eventFilter: { competitionTypes: ['domestic_cup'] },
        });
      }
      if (compTypes.has('international_club') && !merged.some((v) => v.slug === 'international')) {
        merged.push({
          ...base,
          _id: `virtual-scope:partner:${baseSource.ownerId}:international`,
          name: 'International Competition',
          slug: 'international',
          isDefault: false,
          eventFilter: { competitionTypes: ['international_club'] },
        });
      }
    }
    if (sponsors.has('tippmix') && compTypes.size > 1 && !merged.some((v) => v.slug === 'tippmix')) {
      merged.push({
        ...base,
        _id: `virtual-scope:partner:${baseSource.ownerId}:tippmix`,
        name: 'Tippmix Sponsored',
        slug: 'tippmix',
        isDefault: false,
        eventFilter: { sponsorTags: ['tippmix'] },
      });
    }
  }

  return {
    baseSource,
    variants: merged,
  };
}

/**
 * WHAT: Pick which variant a slug (or its absence) resolves to.
 * WHY: Pulled out of resolveReportVariant so tests exercise this exact
 *     function instead of a hand-mirrored copy of its rule -- a prior version
 *     of tests/report-variant-resolution.test.ts asserted against its own
 *     reimplementation, which could not have caught a divergence from this one.
 *
 * Archived variants are not served. The admin workspace offers an
 * Archive/Publish toggle, and until this filter existed pressing Archive
 * changed a badge and nothing else -- the variant kept resolving on its
 * public URL. `listReportVariants` deliberately still returns every status,
 * because the workspace has to show archived ones in order to un-archive
 * them; the exclusion belongs here, at the runtime edge.
 *
 * `draft` is NOT excluded, and that is a live question rather than an
 * oversight: the spec defines status as `active | archived` with no draft
 * state, but the implementation creates every variant as `draft`, so every
 * variant in production is one. Excluding drafts here would 404 all of them
 * at once. Recorded on messmass#244 for a decision.
 */
export function selectServableVariant(
  variants: ReportVariant[],
  variantSlug?: string | null
): ReportVariant | undefined {
  const servable = variants.filter((variant) => variant.status !== 'archived');
  return variantSlug
    ? servable.find((variant) => variant.slug === variantSlug || variant._id === variantSlug)
    : servable.find((variant) => variant.isDefault) || servable[0];
}

export function isNationalTeamEvent(project: any): boolean {
  if (project.competitionType === 'national_team') return true;
  if (project.competitionType && project.competitionType !== 'national_team') return false;
  const scopes: string[] = project.categorizedHashtags?.scope || [];
  if (scopes.includes('national_games')) return true;
  if (scopes.includes('club_games')) return false;
  const leagues: string[] = project.categorizedHashtags?.league || [];
  if (leagues.some((l) => /world_cup|eurobasket|nations_league|european_qualifier|national/i.test(l))) {
    return true;
  }
  const name = String(project.eventName || '');
  return /vb[- ]?selejtez|eb[- ]?selejtez|world cup qualifier|european qualifier|fiba u20|youth nations league/i.test(name);
}

export function filterEventsByReportVariant<T extends Record<string, any>>(
  events: T[],
  variant: Pick<ReportVariant, 'eventScope' | 'eventFilter'>
): T[] {
  let result = events;
  const scope = variant.eventScope;
  if (scope === 'national_games') {
    result = result.filter((event) => isNationalTeamEvent(event));
  } else if (scope === 'club_games') {
    result = result.filter((event) => !isNationalTeamEvent(event));
  }

  const filter = variant.eventFilter;
  if (!filter) return result;

  if (filter.excludeSyntheticRollups) {
    result = result.filter((event) => !event.isSyntheticRollup && event.competitionType !== 'synthetic_rollup');
  }
  if (filter.competitionTypes?.length) {
    const allowed = new Set(filter.competitionTypes);
    result = result.filter((event) => allowed.has(String(event.competitionType || '')));
  }
  if (filter.organizationIds?.length) {
    const allowed = new Set(filter.organizationIds.map(String));
    result = result.filter(
      (event) =>
        allowed.has(String(event.organizationId || '')) ||
        allowed.has(String(event.federationOrganizationId || ''))
    );
  }
  if (filter.leagueTags?.length) {
    const allowed = new Set(filter.leagueTags.map((t) => t.toLowerCase()));
    result = result.filter((event) => {
      const tags: string[] = [
        ...(event.categorizedHashtags?.league || []),
        ...(event.hashtags || []),
      ].map((t: string) => String(t).toLowerCase());
      return tags.some((t) => allowed.has(t));
    });
  }
  if (filter.sponsorTags?.length) {
    const allowed = new Set(filter.sponsorTags.map((t) => t.toLowerCase()));
    result = result.filter((event) => {
      const tags: string[] = [
        ...(event.categorizedHashtags?.sponsor || []),
        ...(event.categorizedHashtags?.partner || []),
        ...(event.hashtags || []),
      ].map((t: string) => String(t).toLowerCase());
      return tags.some((t) => allowed.has(t));
    });
  }
  if (filter.sportTags?.length) {
    const allowed = new Set(filter.sportTags.map((t) => t.toLowerCase()));
    result = result.filter((event) => {
      const tags: string[] = [
        ...(event.categorizedHashtags?.sport || []),
        ...(event.hashtags || []),
      ].map((t: string) => String(t).toLowerCase());
      return tags.some((t) => allowed.has(t));
    });
  }

  return result;
}

export async function resolveOrganizationReportScope(
  db: Db,
  organization: { _id: ObjectId; slug?: string; metadata?: Record<string, any> },
  variant: Pick<ReportVariant, 'eventScope' | 'eventFilter'>
): Promise<{ partners: any[]; projects: any[] }> {
  const orgId = organization._id;
  const metadata = organization.metadata || {};
  const orgType = metadata.orgType as string | undefined;

  const partnersCollection = db.collection('partners');
  const projectsCollection = db.collection('projects');
  const organizationsCollection = db.collection('organizations');

  // Gather child league organization IDs when this organization is a Federation
  const relatedOrgIds: ObjectId[] = [orgId];
  if (orgType === 'federation') {
    const childLeagues = await organizationsCollection
      .find({
        $or: [
          { 'metadata.federationId': orgId.toString() },
          { 'metadata.federationId': orgId },
        ],
      })
      .project({ _id: 1 })
      .toArray();
    for (const child of childLeagues) {
      if (!relatedOrgIds.some((id) => id.equals(child._id))) {
        relatedOrgIds.push(child._id);
      }
    }
    if (Array.isArray(metadata.leagueOrganizationIds)) {
      for (const lid of metadata.leagueOrganizationIds) {
        if (ObjectId.isValid(String(lid))) {
          const oid = new ObjectId(String(lid));
          if (!relatedOrgIds.some((id) => id.equals(oid))) {
            relatedOrgIds.push(oid);
          }
        }
      }
    }
  }

  let assignedPartners = await partnersCollection
    .find({
      $or: [
        { organizationId: { $in: relatedOrgIds } },
        { federationOrganizationId: orgId },
      ],
    })
    .sort({ name: 1 })
    .toArray();

  const partnerIds = assignedPartners.map((p) => p._id);
  const matchConditions: any[] = [
    { organizationId: { $in: relatedOrgIds } },
    { federationOrganizationId: orgId },
  ];

  if (typeof metadata.federationTag === 'string' && metadata.federationTag) {
    matchConditions.push({ 'categorizedHashtags.federation': metadata.federationTag });
  }
  if (typeof metadata.leagueTag === 'string' && metadata.leagueTag) {
    matchConditions.push({ 'categorizedHashtags.league': metadata.leagueTag });
  }
  if (typeof metadata.sponsorTag === 'string' && metadata.sponsorTag) {
    matchConditions.push(
      { 'categorizedHashtags.sponsor': metadata.sponsorTag },
      { hashtags: metadata.sponsorTag }
    );
  }

  // Only include partner-matched fallback events when those events do NOT belong to another organization
  if (partnerIds.length > 0 && orgType !== 'league') {
    matchConditions.push({
      $and: [
        {
          $or: [
            { organizationId: { $in: relatedOrgIds } },
            { organizationId: { $exists: false } },
            { organizationId: null },
          ],
        },
        {
          $or: [
            { partner1: { $in: partnerIds } },
            { partner2: { $in: partnerIds } },
            { partner1Id: { $in: partnerIds } },
            { partner2Id: { $in: partnerIds } },
          ],
        },
      ],
    });
  }

  const rawProjects = await projectsCollection
    .find({ $or: matchConditions })
    .sort({ eventDate: -1 })
    .project({
      _id: 1,
      eventName: 1,
      eventDate: 1,
      viewSlug: 1,
      organizationId: 1,
      federationOrganizationId: 1,
      competitionType: 1,
      isSyntheticRollup: 1,
      partner1: 1,
      partner2: 1,
      partner1Id: 1,
      partner2Id: 1,
      hashtags: 1,
      categorizedHashtags: 1,
      createdAt: 1,
      updatedAt: 1,
      stats: 1,
    })
    .toArray();

  const filteredProjects = filterEventsByReportVariant(rawProjects, variant);

  // Filter partners list when viewing national_games vs club_games variant on a federation
  if (variant.eventScope === 'national_games') {
    assignedPartners = assignedPartners.filter(
      (p) => p.partnerKind === 'national_team' || /national|mkosz|mlsz|mksz|mrsz|sihf|pzpn|zprp/i.test(String(p.name || ''))
    );
  } else if (variant.eventScope === 'club_games') {
    assignedPartners = assignedPartners.filter((p) => p.partnerKind !== 'national_team');
  } else if (orgType === 'sponsor' && assignedPartners.length <= 1 && filteredProjects.length > 0) {
    // For sponsor organizations (e.g. Tippmix / MOL), also surface the clubs participating in the sponsored events
    const activePartnerIdStrs = new Set<string>();
    for (const ev of filteredProjects) {
      const p1 = ev.partner1 || ev.partner1Id;
      const p2 = ev.partner2 || ev.partner2Id;
      if (p1 && ObjectId.isValid(String(p1))) activePartnerIdStrs.add(String(p1));
      if (p2 && ObjectId.isValid(String(p2))) activePartnerIdStrs.add(String(p2));
    }
    if (activePartnerIdStrs.size > 0) {
      assignedPartners = await partnersCollection
        .find({ _id: { $in: Array.from(activePartnerIdStrs).map((id) => new ObjectId(id)) } })
        .sort({ name: 1 })
        .toArray();
    }
  }

  return { partners: assignedPartners, projects: filteredProjects };
}

export async function resolveReportVariant(
  db: Db,
  ownerType: ReportVariantOwnerType,
  ownerId: string,
  variantSlug?: string | null
): Promise<ResolvedReportVariant> {
  const { baseSource, variants } = await listReportVariants(db, ownerType, ownerId);
  const servableVariants = variants.filter((variant) => variant.status !== 'archived');
  const selectedVariant = selectServableVariant(variants, variantSlug);

  if (!selectedVariant) {
    // 404, not 500. A slug that names an archived or non-existent variant is a
    // bad request for a thing that is not there -- routes surface a thrown
    // error as 500 unless it carries a status, and "Archive this report" ending
    // in a server error would read as the archive having broken something.
    throw Object.assign(new Error('Report variant not found'), {
      status: 404,
      code: 'REPORT_VARIANT_NOT_FOUND',
    });
  }

  const runtimeReport = await resolveRuntimeReportById(
    db,
    selectedVariant.reportTemplateId || baseSource.reportTemplateId,
    // 'partner' for every owner type, stated plainly. This was written as
    // `ownerType === 'organization' ? 'partner' : 'partner'` -- identical on
    // both branches, the third instance of that pattern found in this codebase
    // (see F-004, F-005). It reads as a decision and never was one:
    // resolveRuntimeReportById's parameter only accepts 'event' | 'partner',
    // so there is no organization value to choose.
    'partner'
  );

  if (runtimeReport.report) {
    runtimeReport.report.styleId =
      selectedVariant.styleId ||
      baseSource.styleId ||
      runtimeReport.report.styleId;
  }

  return {
    variant: selectedVariant,
    availableVariants: servableVariants,
    isVirtualDefault: selectedVariant._id.startsWith('virtual-default:'),
    period: resolveReportPeriod(
      selectedVariant.periodPreset,
      selectedVariant.customDateRange,
      selectedVariant.timezone
    ),
    runtimeReport,
  };
}

export async function createReportVariant(
  db: Db,
  input: {
    ownerType: ReportVariantOwnerType;
    ownerId: string;
    name: string;
    periodPreset?: ReportPeriodPreset;
    customDateRange?: ReportCustomDateRange | null;
    timezone?: string;
  }
): Promise<ReportVariant> {
  const baseSource = await resolveReportVariantBaseSource(db, input.ownerType, input.ownerId);
  const sourceVariant = buildVirtualDefaultVariant(baseSource);
  const now = new Date().toISOString();
  const collection = db.collection('report_variants');
  const normalizedPeriod = normalizeReportPeriodInput({
    periodPreset: input.periodPreset,
    customDateRange: input.customDateRange,
  });

  let slug = slugifyVariantName(input.name);
  let counter = 2;
  while (await collection.findOne({ ownerType: input.ownerType, ownerId: input.ownerId, slug })) {
    slug = `${slugifyVariantName(input.name)}-${counter}`;
    counter += 1;
  }

  const document = {
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    name: input.name.trim(),
    slug,
    isDefault: false,
    status: 'draft' as ReportVariantStatus,
    timezone: input.timezone || baseSource.timezone || DEFAULT_TIMEZONE,
    periodPreset: normalizedPeriod.periodPreset,
    customDateRange: normalizedPeriod.customDateRange,
    reportTemplateId: sourceVariant.reportTemplateId || null,
    styleId: sourceVariant.styleId || null,
    logoUrl: sourceVariant.logoUrl || null,
    emoji: sourceVariant.emoji || null,
    showEmoji: sourceVariant.showEmoji,
    showMembersList: sourceVariant.showMembersList,
    showMembersListTitle: sourceVariant.showMembersListTitle,
    showMembersListDetails: sourceVariant.showMembersListDetails,
    showEventsList: sourceVariant.showEventsList,
    showEventsListTitle: sourceVariant.showEventsListTitle,
    showEventsListDetails: sourceVariant.showEventsListDetails,
    showOnlyTeam1Events: sourceVariant.showOnlyTeam1Events,
    statsOverrides: sourceVariant.statsOverrides || {},
    createdFromVariantId: sourceVariant._id,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return normalizeVariantRecord({ ...document, _id: result.insertedId });
}

// WHAT: A report variant update: a field left undefined is kept, a field set
//     to null is removed from the stored variant.
// WHY: A variant field the variant does not have falls back to the owner's
//     value (resolveReportVariant, the partner-edit loader's `??`), so removal
//     is how a variant goes back to inheriting -- e.g. a custom variant's own
//     logo removed so the partner's shows again. Undefined could not say that:
//     it was skipped, so the removal was silently dropped.
export type ReportVariantUpdates = { [K in keyof ReportVariant]?: ReportVariant[K] | null };

// WHAT: How the partner editor's save reaches a custom variant: the report
//     content it changed (field-level) and the late-write guard of its tab.
// WHY: The editor used to send the variant's whole report content, and a save
//     given up on (25 s) and sent again could land after the newer one and
//     put the older content back; another device's slot saved meanwhile was
//     overwritten too. Here only the changed slots are written, as
//     `statsOverrides.<key>` paths, and the write is conditional on no newer
//     save from the same tab having landed (lib/statsFieldChanges.ts).
export interface ReportVariantEditorWrite {
  statsOverridesChanges?: StatsFieldChanges | null;
  sequence?: EditorSequence | null;
}

/** Update a variant. */
export async function updateReportVariant(db: Db, variantId: string, updates: ReportVariantUpdates): Promise<ReportVariant>;
/** An editor save: resolves null when the late-write guard turned it away (a newer save from its tab is stored). */
export async function updateReportVariant(
  db: Db,
  variantId: string,
  updates: ReportVariantUpdates,
  editor: ReportVariantEditorWrite
): Promise<ReportVariant | null>;
export async function updateReportVariant(
  db: Db,
  variantId: string,
  updates: ReportVariantUpdates,
  editor?: ReportVariantEditorWrite
): Promise<ReportVariant | null> {
  if (!ObjectId.isValid(variantId)) {
    throw new Error('Invalid report variant id');
  }

  const collection = db.collection('report_variants');
  const existing = await collection.findOne({ _id: new ObjectId(variantId) });
  if (!existing) {
    throw new Error('Report variant not found');
  }

  const normalizedUpdates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  const removedFields: Record<string, ''> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === '_id' || key === 'ownerType' || key === 'ownerId' || value === undefined) continue;
    if (value === null) removedFields[key] = '';
    else normalizedUpdates[key] = value;
  }

  if (typeof updates.name === 'string' && updates.name.trim()) {
    normalizedUpdates.name = updates.name.trim();
  }

  if (typeof updates.slug === 'string' && updates.slug.trim()) {
    normalizedUpdates.slug = slugifyVariantName(updates.slug);
  }

  const normalizedPeriod = normalizeReportPeriodUpdate(
    {
      periodPreset: existing.periodPreset,
      customDateRange: existing.customDateRange,
    },
    updates
  );
  if (normalizedPeriod) {
    normalizedUpdates.periodPreset = normalizedPeriod.periodPreset;
    normalizedUpdates.customDateRange = normalizedPeriod.customDateRange;
  }

  if (updates.isDefault === true) {
    await collection.updateMany(
      {
        ownerType: existing.ownerType,
        ownerId: existing.ownerId,
        _id: { $ne: existing._id },
      },
      { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
    );
  }

  // A field the normalisation above sets (the period pair, updatedAt) is not
  // also removed: MongoDB refuses $set and $unset on the same path.
  for (const key of Object.keys(normalizedUpdates)) delete removedFields[key];

  // Field-level report content: only the keys that differ from the stored
  // variant, as dotted paths, so a slot another writer stored between this
  // read and this write is kept.
  if (editor?.statsOverridesChanges) {
    const { set, unset } = statsUpdateOperators(
      'statsOverrides',
      existing.statsOverrides,
      applyStatsFieldChanges(existing.statsOverrides, editor.statsOverridesChanges),
      editor.statsOverridesChanges.removed
    );
    Object.assign(normalizedUpdates, set);
    Object.assign(removedFields, unset);
  }

  const filter: Record<string, unknown> = { _id: existing._id };
  if (editor?.sequence) {
    const guard = editorSequenceGuard(editor.sequence);
    Object.assign(filter, guard.filter);
    Object.assign(normalizedUpdates, guard.set);
  }

  const update: Record<string, unknown> = { $set: normalizedUpdates };
  if (Object.keys(removedFields).length > 0) update.$unset = removedFields;

  const result = await collection.updateOne(filter, update);
  if (editor?.sequence && result.matchedCount === 0) {
    // Turned away by the guard -- unless the variant was deleted meanwhile.
    if (await collection.findOne({ _id: existing._id }, { projection: { _id: 1 } })) return null;
    throw new Error('Report variant not found');
  }
  const updated = await collection.findOne({ _id: existing._id });
  if (!updated) {
    throw new Error('Updated report variant could not be loaded');
  }

  return normalizeVariantRecord(updated);
}
