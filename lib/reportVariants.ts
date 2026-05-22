import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { findHashtagsByFilterSlug } from '@/lib/slugUtils';
import {
  ReportPeriodPreset,
  ReportCustomDateRange,
  resolveReportPeriod,
  type ResolvedReportPeriod,
} from '@/lib/reportPeriods';
import { resolveRuntimeReportById, type RuntimeReportResolution } from '@/lib/reportRuntime';

export type ReportVariantOwnerType = 'organization' | 'partner' | 'hashtag' | 'filter';
export type ReportVariantStatus = 'draft' | 'published' | 'archived';

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
      ? await organizations.findOne({ _id: new ObjectId(ownerId) })
      : null;

    if (!organization) {
      throw new Error('Organization not found');
    }

    const metadata = (organization.metadata || {}) as Record<string, unknown>;
    return {
      ownerType,
      ownerId,
      ownerName: organization.name,
      timezone: DEFAULT_TIMEZONE,
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
    const partner = ObjectId.isValid(ownerId)
      ? await partners.findOne({ _id: new ObjectId(ownerId) })
      : await partners.findOne({ viewSlug: ownerId } as any);

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

  return {
    ownerType,
    ownerId,
    ownerName: `#${ownerId}`,
    timezone: DEFAULT_TIMEZONE,
    statsOverrides: {},
  };
}

export function buildVirtualDefaultVariant(baseSource: ReportVariantBaseSource): ReportVariant {
  return {
    _id: `virtual-default:${baseSource.ownerType}:${baseSource.ownerId}`,
    ownerType: baseSource.ownerType,
    ownerId: baseSource.ownerId,
    name: 'DEFAULT',
    slug: 'default',
    isDefault: true,
    status: 'published',
    timezone: baseSource.timezone || DEFAULT_TIMEZONE,
    periodPreset: 'all_time',
    customDateRange: null,
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

export async function listReportVariants(
  db: Db,
  ownerType: ReportVariantOwnerType,
  ownerId: string
): Promise<{ baseSource: ReportVariantBaseSource; variants: ReportVariant[] }> {
  const baseSource = await resolveReportVariantBaseSource(db, ownerType, ownerId);
  const collection = db.collection('report_variants');
  const stored = await collection
    .find({ ownerType, ownerId })
    .sort({ isDefault: -1, createdAt: 1, name: 1 })
    .toArray();

  const variants = stored.map(normalizeVariantRecord);
  const hasStoredDefault = variants.some((variant) => variant.isDefault);

  return {
    baseSource,
    variants: hasStoredDefault
      ? variants
      : [buildVirtualDefaultVariant(baseSource), ...variants],
  };
}

export async function resolveReportVariant(
  db: Db,
  ownerType: ReportVariantOwnerType,
  ownerId: string,
  variantSlug?: string | null
): Promise<ResolvedReportVariant> {
  const { baseSource, variants } = await listReportVariants(db, ownerType, ownerId);
  const selectedVariant = variantSlug
    ? variants.find((variant) => variant.slug === variantSlug || variant._id === variantSlug)
    : variants.find((variant) => variant.isDefault) || variants[0];

  if (!selectedVariant) {
    throw new Error('Report variant not found');
  }

  const runtimeReport = await resolveRuntimeReportById(
    db,
    selectedVariant.reportTemplateId || baseSource.reportTemplateId,
    ownerType === 'organization' ? 'partner' : 'partner'
  );

  if (runtimeReport.report) {
    runtimeReport.report.styleId =
      selectedVariant.styleId ||
      baseSource.styleId ||
      runtimeReport.report.styleId;
  }

  return {
    variant: selectedVariant,
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
    periodPreset: input.periodPreset || 'all_time',
    customDateRange: input.customDateRange || null,
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

export async function updateReportVariant(
  db: Db,
  variantId: string,
  updates: Partial<ReportVariant>
): Promise<ReportVariant> {
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

  for (const [key, value] of Object.entries(updates)) {
    if (key === '_id' || key === 'ownerType' || key === 'ownerId' || value === undefined) continue;
    normalizedUpdates[key] = value;
  }

  if (typeof updates.name === 'string' && updates.name.trim()) {
    normalizedUpdates.name = updates.name.trim();
  }

  if (typeof updates.slug === 'string' && updates.slug.trim()) {
    normalizedUpdates.slug = slugifyVariantName(updates.slug);
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

  await collection.updateOne({ _id: existing._id }, { $set: normalizedUpdates });
  const updated = await collection.findOne({ _id: existing._id });
  if (!updated) {
    throw new Error('Updated report variant could not be loaded');
  }

  return normalizeVariantRecord(updated);
}
