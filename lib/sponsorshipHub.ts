import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

export type SponsorshipHubScopeType = 'portfolio' | 'partner' | 'organization' | 'project';
export type SponsorshipHubRangePreset = 'all' | '30d' | '90d' | '365d';
export type SponsorshipMetricFormat = 'number' | 'currency' | 'percentage';

type ProjectRecord = {
  _id: ObjectId;
  eventName?: string;
  eventDate?: string;
  viewSlug?: string;
  partner1?: ObjectId;
  partner2?: ObjectId;
  partner1Id?: ObjectId | string;
  partner2Id?: ObjectId | string;
  partner1Name?: string;
  partner2Name?: string;
  stats?: Record<string, unknown>;
};

type PartnerRecord = {
  _id: ObjectId;
  name: string;
  emoji?: string;
  organizationId?: ObjectId;
  viewSlug?: string;
};

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
};

type BitlyProjectLinkRecord = {
  projectId: ObjectId;
  cachedMetrics?: {
    clicks?: number;
    uniqueClicks?: number;
    topCountries?: Array<{
      country: string;
      clicks: number;
    }>;
    topReferrers?: Array<{
      domain: string;
      clicks: number;
    }>;
    dailyClicks?: Array<{
      date: string;
      clicks: number;
    }>;
  };
};

export interface SponsorshipHubRequest {
  scopeType: SponsorshipHubScopeType;
  scopeId?: string | null;
  rangePreset?: SponsorshipHubRangePreset;
}

export interface SponsorshipActionLinks {
  reportUrl: string | null;
  adminUrl: string | null;
  activationUrl: string | null;
}

export interface SponsorshipTrendPoint {
  date: string;
  label: string;
  fans: number;
  adValue: number;
  bitlyClicks: number;
  engagementRate: number;
}

export interface SponsorshipBreakdownRow {
  key: string;
  label: string;
  value: number;
  format: SponsorshipMetricFormat;
  source: string;
}

export interface SponsorshipTopProject {
  projectId: string;
  eventName: string;
  eventDate: string | null;
  partnerLabel: string;
  primaryPartnerId: string | null;
  primaryPartnerName: string | null;
  fans: number;
  adValue: number;
  bitlyClicks: number;
  engagementRate: number;
  viewSlug: string | null;
}

export interface SponsorshipTopPartner {
  partnerId: string;
  name: string;
  emoji?: string;
  eventCount: number;
  totalFans: number;
  totalAdValue: number;
  totalBitlyClicks: number;
  avgEngagementRate: number;
  attributionBasis: 'primary_partner';
}

export interface SponsorshipProjectDrilldown {
  projectId: string;
  eventName: string;
  eventDate: string | null;
  partnerLabel: string;
  primaryPartnerId: string | null;
  primaryPartnerName: string | null;
  viewSlug: string | null;
  sourceBreakdown: SponsorshipBreakdownRow[];
  topCountries: Array<{
    label: string;
    clicks: number;
  }>;
  topReferrers: Array<{
    label: string;
    clicks: number;
  }>;
  trend: SponsorshipTrendPoint[];
  actions: SponsorshipActionLinks;
}

export interface SponsorshipPartnerAttributedProject {
  projectId: string;
  eventName: string;
  eventDate: string | null;
  fans: number;
  adValue: number;
  bitlyClicks: number;
  engagementRate: number;
  reportUrl: string | null;
}

export interface SponsorshipPartnerDrilldown {
  partnerId: string;
  name: string;
  emoji?: string;
  eventCount: number;
  attributionBasis: 'primary_partner';
  sourceBreakdown: SponsorshipBreakdownRow[];
  trend: SponsorshipTrendPoint[];
  attributedProjects: SponsorshipPartnerAttributedProject[];
  attributionSummary: string;
  actions: SponsorshipActionLinks;
}

export interface SponsorshipActivationProofItem {
  projectId: string;
  eventName: string;
  eventDate: string | null;
  partnerId: string | null;
  partnerName: string | null;
  partnerLabel: string;
  fans: number;
  adValue: number;
  bitlyClicks: number;
  hasFanEvidence: boolean;
  hasMediaEvidence: boolean;
  hasBitlyEvidence: boolean;
  hasReportLink: boolean;
  readinessScore: number;
  priorityScore: number;
  missingReasons: string[];
  reportUrl: string | null;
  projectAdminUrl: string | null;
  partnerAnalyticsUrl: string | null;
  partnerReportUrl: string | null;
  activationUrl: string | null;
}

export interface SponsorshipActivationPartnerQueue {
  partnerId: string;
  name: string;
  emoji?: string;
  projectCount: number;
  readyProjectCount: number;
  gapProjectCount: number;
  totalAdValue: number;
  totalBitlyClicks: number;
  actions: SponsorshipActionLinks;
}

export interface SponsorshipActivationWorkspace {
  readinessScore: number;
  readyProjects: number;
  needsBitlyProjects: number;
  needsReportProjects: number;
  proofItems: SponsorshipActivationProofItem[];
  partnerQueues: SponsorshipActivationPartnerQueue[];
  nextActions: string[];
}

export interface SponsorshipHubResponse {
  scope: {
    type: SponsorshipHubScopeType;
    id: string | null;
    name: string;
    description: string;
  };
  filters: {
    rangePreset: SponsorshipHubRangePreset;
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    eventCount: number;
    partnerCount: number;
    totalFans: number;
    totalImages: number;
    totalImpressions: number;
    totalAdValue: number;
    totalBitlyClicks: number;
    totalBitlyUniqueClicks: number;
    avgEngagementRate: number;
    avgBitlyClickRate: number;
    earliestEventDate: string | null;
    latestEventDate: string | null;
  };
  scopeActions: SponsorshipActionLinks;
  channels: Array<{
    key: 'fan' | 'media' | 'bitly';
    label: string;
    primaryValue: number;
    primaryFormat: SponsorshipMetricFormat;
    secondaryLabel: string;
    secondaryValue: number;
    secondaryFormat: SponsorshipMetricFormat;
    source: string;
    description: string;
  }>;
  coverage: {
    projectsWithBitly: number;
    projectsWithoutBitly: number;
    bitlyCoverageRate: number;
  };
  trend: SponsorshipTrendPoint[];
  topProjects: SponsorshipTopProject[];
  topPartners: SponsorshipTopPartner[];
  projectDrilldowns: SponsorshipProjectDrilldown[];
  partnerDrilldowns: SponsorshipPartnerDrilldown[];
  activationWorkspace: SponsorshipActivationWorkspace;
}

type TrendAccumulator = {
  date: string;
  label: string;
  fans: number;
  adValue: number;
  bitlyClicks: number;
  engagementRateSum: number;
  engagementSamples: number;
};

type ProjectAccumulator = SponsorshipTopProject & {
  engagementSamples: number;
};

type PartnerAccumulator = SponsorshipTopPartner & {
  totalBitlyUniqueClicks: number;
  engagementSamples: number;
  attributedProjects: SponsorshipPartnerAttributedProject[];
};

type BitlyAggregate = {
  clicks: number;
  uniqueClicks: number;
  topCountries: Map<string, number>;
  topReferrers: Map<string, number>;
  dailyClicks: Map<string, number>;
};

function normalizeObjectId(value: ObjectId | string | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toString();
}

function toObjectId(value: string, label: string): ObjectId {
  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return new ObjectId(value);
}

function isEventAggregate(aggregate: AnalyticsAggregate) {
  return aggregate.aggregationType === 'event' || aggregate.aggregationType === undefined;
}

function formatDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatTrendLabel(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function resolveDateRange(rangePreset: SponsorshipHubRangePreset) {
  if (rangePreset === 'all') {
    return { startDate: null, endDate: null };
  }

  const endDate = new Date();
  const startDate = new Date();
  const days = rangePreset === '30d' ? 30 : rangePreset === '90d' ? 90 : 365;
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDateOnly(startDate),
    endDate: formatDateOnly(endDate),
  };
}

function isDateInRange(eventDate: string | undefined, startDate: string | null, endDate: string | null) {
  if (!eventDate) return false;
  if (startDate && eventDate < startDate) return false;
  if (endDate && eventDate > endDate) return false;
  return true;
}

function buildActivationUrl(scopeType: SponsorshipHubScopeType, scopeId: string | null, rangePreset: SponsorshipHubRangePreset) {
  const params = new URLSearchParams({ scopeType, rangePreset });
  if (scopeId) {
    params.set('scopeId', scopeId);
  }
  return `/admin/analytics/sponsorship/activation?${params.toString()}`;
}

function buildScopeActions(
  scopeType: SponsorshipHubScopeType,
  scopeId: string | null,
  rangePreset: SponsorshipHubRangePreset,
  partner?: PartnerRecord | null,
  project?: ProjectRecord | null
): SponsorshipActionLinks {
  if (scopeType === 'partner' && scopeId) {
    return {
      reportUrl: partner?.viewSlug ? `/partner-report/${partner.viewSlug}` : null,
      adminUrl: `/admin/partners/${scopeId}/analytics`,
      activationUrl: buildActivationUrl(scopeType, scopeId, rangePreset),
    };
  }

  if (scopeType === 'organization' && scopeId) {
    return {
      reportUrl: `/organization-report/${scopeId}`,
      adminUrl: '/admin/organizations',
      activationUrl: buildActivationUrl(scopeType, scopeId, rangePreset),
    };
  }

  if (scopeType === 'project' && scopeId) {
    return {
      reportUrl: project?.viewSlug ? `/report/${project.viewSlug}` : null,
      adminUrl: '/admin/events',
      activationUrl: buildActivationUrl(scopeType, scopeId, rangePreset),
    };
  }

  return {
    reportUrl: null,
    adminUrl: '/admin',
    activationUrl: buildActivationUrl(scopeType, scopeId, rangePreset),
  };
}

function createEmptyBitlyAggregate(): BitlyAggregate {
  return {
    clicks: 0,
    uniqueClicks: 0,
    topCountries: new Map<string, number>(),
    topReferrers: new Map<string, number>(),
    dailyClicks: new Map<string, number>(),
  };
}

function mergeBitlyAggregate(target: BitlyAggregate, source?: BitlyProjectLinkRecord['cachedMetrics']) {
  if (!source) return;

  target.clicks += source.clicks || 0;
  target.uniqueClicks += source.uniqueClicks || 0;

  (source.topCountries || []).forEach((entry) => {
    target.topCountries.set(entry.country, (target.topCountries.get(entry.country) || 0) + (entry.clicks || 0));
  });

  (source.topReferrers || []).forEach((entry) => {
    target.topReferrers.set(entry.domain, (target.topReferrers.get(entry.domain) || 0) + (entry.clicks || 0));
  });

  (source.dailyClicks || []).forEach((entry) => {
    target.dailyClicks.set(entry.date, (target.dailyClicks.get(entry.date) || 0) + (entry.clicks || 0));
  });
}

function summarizeMap(map: Map<string, number>, limit = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, clicks]) => ({ label, clicks }));
}

function finalizeTrendSeries(accumulator: Map<string, TrendAccumulator>): SponsorshipTrendPoint[] {
  return [...accumulator.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({
      date: point.date,
      label: point.label,
      fans: point.fans,
      adValue: point.adValue,
      bitlyClicks: point.bitlyClicks,
      engagementRate: point.engagementSamples > 0 ? point.engagementRateSum / point.engagementSamples : 0,
    }));
}

function upsertTrendPoint(
  trendMap: Map<string, TrendAccumulator>,
  date: string | null,
  values: {
    fans: number;
    adValue: number;
    bitlyClicks: number;
    engagementRate: number;
  }
) {
  if (!date) return;
  const current = trendMap.get(date) || {
    date,
    label: formatTrendLabel(date),
    fans: 0,
    adValue: 0,
    bitlyClicks: 0,
    engagementRateSum: 0,
    engagementSamples: 0,
  };

  current.fans += values.fans;
  current.adValue += values.adValue;
  current.bitlyClicks += values.bitlyClicks;
  current.engagementRateSum += values.engagementRate;
  current.engagementSamples += 1;

  trendMap.set(date, current);
}

function emptyHub(
  scopeType: SponsorshipHubScopeType,
  scopeId: string | null,
  scopeName: string,
  description: string,
  rangePreset: SponsorshipHubRangePreset,
  startDate: string | null,
  endDate: string | null
): SponsorshipHubResponse {
  return {
    scope: {
      type: scopeType,
      id: scopeId,
      name: scopeName,
      description,
    },
    filters: {
      rangePreset,
      startDate,
      endDate,
    },
    summary: {
      eventCount: 0,
      partnerCount: 0,
      totalFans: 0,
      totalImages: 0,
      totalImpressions: 0,
      totalAdValue: 0,
      totalBitlyClicks: 0,
      totalBitlyUniqueClicks: 0,
      avgEngagementRate: 0,
      avgBitlyClickRate: 0,
      earliestEventDate: null,
      latestEventDate: null,
    },
    scopeActions: {
      reportUrl: null,
      adminUrl: scopeType === 'portfolio' ? '/admin' : null,
      activationUrl: buildActivationUrl(scopeType, scopeId, rangePreset),
    },
    channels: [
      {
        key: 'fan',
        label: 'Fan Engagement Evidence',
        primaryValue: 0,
        primaryFormat: 'number',
        secondaryLabel: 'Avg engagement rate',
        secondaryValue: 0,
        secondaryFormat: 'percentage',
        source: 'analytics_aggregates.fanMetrics',
        description: 'On-site and remote fan signals from event analytics.',
      },
      {
        key: 'media',
        label: 'Media Value Evidence',
        primaryValue: 0,
        primaryFormat: 'currency',
        secondaryLabel: 'Tracked impressions',
        secondaryValue: 0,
        secondaryFormat: 'number',
        source: 'analytics_aggregates.adMetrics',
        description: 'Calculated media value and impression estimates from event analytics.',
      },
      {
        key: 'bitly',
        label: 'Tracked Link Evidence',
        primaryValue: 0,
        primaryFormat: 'number',
        secondaryLabel: 'Avg Bitly click rate',
        secondaryValue: 0,
        secondaryFormat: 'percentage',
        source: 'bitly_project_links.cachedMetrics',
        description: 'Click-through evidence aggregated from Bitly link associations.',
      },
    ],
    coverage: {
      projectsWithBitly: 0,
      projectsWithoutBitly: 0,
      bitlyCoverageRate: 0,
    },
    trend: [],
    topProjects: [],
    topPartners: [],
    projectDrilldowns: [],
    partnerDrilldowns: [],
    activationWorkspace: {
      readinessScore: 0,
      readyProjects: 0,
      needsBitlyProjects: 0,
      needsReportProjects: 0,
      proofItems: [],
      partnerQueues: [],
      nextActions: [],
    },
  };
}

export async function getSponsorshipHubData({
  scopeType,
  scopeId,
  rangePreset = 'all',
}: SponsorshipHubRequest): Promise<SponsorshipHubResponse> {
  const db = await getDb();
  const projectsCollection = db.collection<ProjectRecord>('projects');
  const partnersCollection = db.collection<PartnerRecord>('partners');
  const organizationsCollection = db.collection<OrganizationRecord>('organizations');
  const aggregatesCollection = db.collection<AnalyticsAggregate>('analytics_aggregates');
  const bitlyProjectLinksCollection = db.collection<BitlyProjectLinkRecord>('bitly_project_links');
  const { startDate, endDate } = resolveDateRange(rangePreset);

  let scopeName = 'All tracked sponsorship activity';
  let scopeDescription = 'Unified sponsorship performance across all tracked projects, partners, and organizations.';
  let projects: ProjectRecord[] = [];
  let scopedPartner: PartnerRecord | null = null;
  let scopedProject: ProjectRecord | null = null;

  if (scopeType === 'partner') {
    const partnerId = toObjectId(scopeId || '', 'partner id');
    const partner = await partnersCollection.findOne({ _id: partnerId });
    if (!partner) {
      throw new Error('Partner not found');
    }

    scopedPartner = partner;
    scopeName = partner.name;
    scopeDescription = 'Unified sponsorship performance for one partner across all related events.';
    projects = await projectsCollection
      .find({
        $or: [
          { partner1: partnerId },
          { partner2: partnerId },
          { partner1Id: partnerId },
          { partner2Id: partnerId },
          { partner1Id: partnerId.toString() },
          { partner2Id: partnerId.toString() },
        ],
      })
      .project({
        _id: 1,
        eventName: 1,
        eventDate: 1,
        viewSlug: 1,
        partner1: 1,
        partner2: 1,
        partner1Id: 1,
        partner2Id: 1,
        partner1Name: 1,
        partner2Name: 1,
        stats: 1,
      })
      .sort({ eventDate: -1 })
      .toArray() as ProjectRecord[];
  }

  if (scopeType === 'organization') {
    const organizationId = toObjectId(scopeId || '', 'organization id');
    const organization = await organizationsCollection.findOne({ _id: organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    scopeName = organization.name;
    scopeDescription = 'Unified sponsorship performance for all partner members assigned to this organization.';

    const partners = await partnersCollection
      .find({ organizationId })
      .project({ _id: 1 })
      .toArray();
    const partnerIds = partners.map((partner) => partner._id);

    if (partnerIds.length === 0) {
      return emptyHub(scopeType, scopeId || null, scopeName, scopeDescription, rangePreset, startDate, endDate);
    }

    projects = await projectsCollection
      .find({
        $or: [
          { partner1: { $in: partnerIds } },
          { partner2: { $in: partnerIds } },
          { partner1Id: { $in: partnerIds } },
          { partner2Id: { $in: partnerIds } },
          { partner1Id: { $in: partnerIds.map((id) => id.toString()) } },
          { partner2Id: { $in: partnerIds.map((id) => id.toString()) } },
        ],
      })
      .project({
        _id: 1,
        eventName: 1,
        eventDate: 1,
        viewSlug: 1,
        partner1: 1,
        partner2: 1,
        partner1Id: 1,
        partner2Id: 1,
        partner1Name: 1,
        partner2Name: 1,
        stats: 1,
      })
      .sort({ eventDate: -1 })
      .toArray() as ProjectRecord[];
  }

  if (scopeType === 'project') {
    const projectId = toObjectId(scopeId || '', 'project id');
    const project = await projectsCollection.findOne(
      { _id: projectId },
      {
        projection: {
          _id: 1,
          eventName: 1,
          eventDate: 1,
          viewSlug: 1,
          partner1: 1,
          partner2: 1,
          partner1Id: 1,
          partner2Id: 1,
          partner1Name: 1,
          partner2Name: 1,
          stats: 1,
        },
      }
    );
    if (!project) {
      throw new Error('Project not found');
    }

    scopedProject = project;
    scopeName = project.eventName || 'Selected project';
    scopeDescription = 'Unified sponsorship performance for a single project.';
    projects = [project];
  }

  let aggregates: AnalyticsAggregate[] = [];

  if (scopeType === 'portfolio') {
    const aggregateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      aggregateQuery.eventDate = {};
      if (startDate) {
        (aggregateQuery.eventDate as Record<string, string>).$gte = startDate;
      }
      if (endDate) {
        (aggregateQuery.eventDate as Record<string, string>).$lte = endDate;
      }
    }

    aggregates = (await aggregatesCollection.find(aggregateQuery).sort({ eventDate: -1 }).toArray()).filter(isEventAggregate);

    const aggregateProjectIds = [...new Set(aggregates.map((aggregate) => aggregate.projectId.toString()))]
      .filter((value) => ObjectId.isValid(value))
      .map((value) => new ObjectId(value));

    if (aggregateProjectIds.length > 0) {
      projects = await projectsCollection
        .find({ _id: { $in: aggregateProjectIds } })
        .project({
          _id: 1,
          eventName: 1,
          eventDate: 1,
          viewSlug: 1,
          partner1: 1,
          partner2: 1,
          partner1Id: 1,
          partner2Id: 1,
          partner1Name: 1,
          partner2Name: 1,
          stats: 1,
        })
        .toArray() as ProjectRecord[];
    }
  } else {
    projects = projects.filter((project) => isDateInRange(project.eventDate, startDate, endDate));
    const projectIds = projects.map((project) => project._id);
    if (projectIds.length > 0) {
      const aggregateQuery: Record<string, unknown> = { projectId: { $in: projectIds } };
      if (startDate || endDate) {
        aggregateQuery.eventDate = {};
        if (startDate) {
          (aggregateQuery.eventDate as Record<string, string>).$gte = startDate;
        }
        if (endDate) {
          (aggregateQuery.eventDate as Record<string, string>).$lte = endDate;
        }
      }

      aggregates = (await aggregatesCollection.find(aggregateQuery).sort({ eventDate: -1 }).toArray()).filter(isEventAggregate);
    }
  }

  if (projects.length === 0 && aggregates.length === 0) {
    return emptyHub(scopeType, scopeId || null, scopeName, scopeDescription, rangePreset, startDate, endDate);
  }

  const projectMap = new Map(projects.map((project) => [project._id.toString(), project]));

  const allPartnerIds = new Set<string>();
  projects.forEach((project) => {
    const partner1Id = normalizeObjectId(project.partner1 || project.partner1Id);
    const partner2Id = normalizeObjectId(project.partner2 || project.partner2Id);
    if (partner1Id) allPartnerIds.add(partner1Id);
    if (partner2Id) allPartnerIds.add(partner2Id);
  });
  aggregates.forEach((aggregate) => {
    const partnerId = normalizeObjectId(aggregate.partnerContext?.partnerId);
    const opponentId = normalizeObjectId(aggregate.partnerContext?.opponentId);
    if (partnerId) allPartnerIds.add(partnerId);
    if (opponentId) allPartnerIds.add(opponentId);
  });

  const partnerDocuments = allPartnerIds.size > 0
    ? await partnersCollection
        .find({ _id: { $in: [...allPartnerIds].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, emoji: 1, viewSlug: 1 })
        .toArray()
    : [];
  const partnerMap = new Map(partnerDocuments.map((partner) => [partner._id.toString(), partner]));

  const projectIds = [...new Set([
    ...projects.map((project) => project._id.toString()),
    ...aggregates.map((aggregate) => aggregate.projectId.toString()),
  ])]
    .filter((value) => ObjectId.isValid(value))
    .map((value) => new ObjectId(value));

  const bitlyAssociations = projectIds.length > 0
    ? await bitlyProjectLinksCollection.find({ projectId: { $in: projectIds } }).toArray()
    : [];

  const bitlyByProject = new Map<string, BitlyAggregate>();
  bitlyAssociations.forEach((association) => {
    const key = association.projectId.toString();
    const current = bitlyByProject.get(key) || createEmptyBitlyAggregate();
    mergeBitlyAggregate(current, association.cachedMetrics);
    bitlyByProject.set(key, current);
  });

  const scopeTrendMap = new Map<string, TrendAccumulator>();
  const topProjectMap = new Map<string, ProjectAccumulator>();
  const partnerActivity = new Map<string, PartnerAccumulator>();
  let totalFans = 0;
  let totalImages = 0;
  let totalImpressions = 0;
  let totalAdValue = 0;
  let totalEngagementRate = 0;
  let totalBitlyClickRate = 0;
  let earliestEventDate: string | null = null;
  let latestEventDate: string | null = null;

  const ensurePartnerAccumulator = (partnerId: string, fallbackName?: string) => {
    const existing = partnerActivity.get(partnerId);
    if (existing) return existing;

    const partner = partnerMap.get(partnerId);
    const created: PartnerAccumulator = {
      partnerId,
      name: partner?.name || fallbackName || 'Unknown partner',
      emoji: partner?.emoji,
      eventCount: 0,
      totalFans: 0,
      totalAdValue: 0,
      totalBitlyClicks: 0,
      totalBitlyUniqueClicks: 0,
      avgEngagementRate: 0,
      attributionBasis: 'primary_partner',
      engagementSamples: 0,
      attributedProjects: [],
    };
    partnerActivity.set(partnerId, created);
    return created;
  };

  aggregates.forEach((aggregate) => {
    const projectId = aggregate.projectId.toString();
    const project = projectMap.get(projectId);
    const bitly = bitlyByProject.get(projectId) || createEmptyBitlyAggregate();
    const projectEventDate = aggregate.eventDate || project?.eventDate || null;
    const resolvedPartnerId = normalizeObjectId(aggregate.partnerContext?.partnerId)
      || normalizeObjectId(project?.partner1 || project?.partner1Id);
    const resolvedPartner = resolvedPartnerId ? partnerMap.get(resolvedPartnerId) : null;
    const partnerLabel = aggregate.partnerContext?.partnerName
      || project?.partner1Name
      || project?.partner2Name
      || resolvedPartner?.name
      || 'Unassigned partner';

    totalFans += aggregate.fanMetrics?.totalFans || 0;
    totalImages += (aggregate.rawStats?.remoteImages || 0) + (aggregate.rawStats?.hostessImages || 0) + (aggregate.rawStats?.selfies || 0);
    totalImpressions += aggregate.adMetrics?.totalImpressions || 0;
    totalAdValue += aggregate.adMetrics?.totalROI || 0;
    totalEngagementRate += aggregate.fanMetrics?.engagementRate || 0;
    totalBitlyClickRate += aggregate.bitlyMetrics?.clickRate || 0;

    if (projectEventDate && (!earliestEventDate || projectEventDate < earliestEventDate)) {
      earliestEventDate = projectEventDate;
    }
    if (projectEventDate && (!latestEventDate || projectEventDate > latestEventDate)) {
      latestEventDate = projectEventDate;
    }

    upsertTrendPoint(scopeTrendMap, projectEventDate, {
      fans: aggregate.fanMetrics?.totalFans || 0,
      adValue: aggregate.adMetrics?.totalROI || 0,
      bitlyClicks: bitly.clicks,
      engagementRate: aggregate.fanMetrics?.engagementRate || 0,
    });

    const currentProject = topProjectMap.get(projectId) || {
      projectId,
      eventName: project?.eventName || 'Untitled event',
      eventDate: projectEventDate,
      partnerLabel,
      primaryPartnerId: resolvedPartnerId,
      primaryPartnerName: resolvedPartner?.name || aggregate.partnerContext?.partnerName || null,
      fans: 0,
      adValue: 0,
      bitlyClicks: bitly.clicks,
      engagementRate: 0,
      viewSlug: project?.viewSlug || null,
      engagementSamples: 0,
    };

    currentProject.fans += aggregate.fanMetrics?.totalFans || 0;
    currentProject.adValue += aggregate.adMetrics?.totalROI || 0;
    currentProject.bitlyClicks = bitly.clicks;
    currentProject.engagementRate += aggregate.fanMetrics?.engagementRate || 0;
    currentProject.engagementSamples += 1;
    topProjectMap.set(projectId, currentProject);

    if (resolvedPartnerId) {
      const partner = ensurePartnerAccumulator(resolvedPartnerId, aggregate.partnerContext?.partnerName || project?.partner1Name);
      partner.eventCount += 1;
      partner.totalFans += aggregate.fanMetrics?.totalFans || 0;
      partner.totalAdValue += aggregate.adMetrics?.totalROI || 0;
      partner.totalBitlyClicks += bitly.clicks;
      partner.totalBitlyUniqueClicks += bitly.uniqueClicks;
      partner.avgEngagementRate += aggregate.fanMetrics?.engagementRate || 0;
      partner.engagementSamples += 1;
      partner.attributedProjects.push({
        projectId,
        eventName: project?.eventName || 'Untitled event',
        eventDate: projectEventDate,
        fans: aggregate.fanMetrics?.totalFans || 0,
        adValue: aggregate.adMetrics?.totalROI || 0,
        bitlyClicks: bitly.clicks,
        engagementRate: aggregate.fanMetrics?.engagementRate || 0,
        reportUrl: project?.viewSlug ? `/report/${project.viewSlug}` : null,
      });
      partnerActivity.set(resolvedPartnerId, partner);
    }
  });

  const topProjects = [...topProjectMap.values()]
    .map((project) => ({
      ...project,
      engagementRate: project.engagementSamples > 0 ? project.engagementRate / project.engagementSamples : 0,
    }))
    .sort((a, b) => {
      const scoreA = a.adValue + a.bitlyClicks + a.fans / 100;
      const scoreB = b.adValue + b.bitlyClicks + b.fans / 100;
      return scoreB - scoreA;
    });

  const topPartners = [...partnerActivity.values()]
    .map((partner) => ({
      partnerId: partner.partnerId,
      name: partner.name,
      emoji: partner.emoji,
      eventCount: partner.eventCount,
      totalFans: partner.totalFans,
      totalAdValue: partner.totalAdValue,
      totalBitlyClicks: partner.totalBitlyClicks,
      avgEngagementRate: partner.engagementSamples > 0 ? partner.avgEngagementRate / partner.engagementSamples : 0,
      attributionBasis: partner.attributionBasis,
    }))
    .sort((a, b) => {
      const scoreA = a.totalAdValue + a.totalBitlyClicks + a.totalFans / 100;
      const scoreB = b.totalAdValue + b.totalBitlyClicks + b.totalFans / 100;
      return scoreB - scoreA;
    });

  const projectDrilldowns: SponsorshipProjectDrilldown[] = topProjects.map((project) => {
    const projectDoc = projectMap.get(project.projectId);
    const bitly = bitlyByProject.get(project.projectId) || createEmptyBitlyAggregate();
    const projectTrendMap = new Map<string, TrendAccumulator>();

    const matchingAggregate = aggregates.find((aggregate) => aggregate.projectId.toString() === project.projectId);
    if (bitly.dailyClicks.size > 0) {
      [...bitly.dailyClicks.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, clicks]) => {
          upsertTrendPoint(projectTrendMap, date, {
            fans: 0,
            adValue: 0,
            bitlyClicks: clicks,
            engagementRate: 0,
          });
        });
    } else if (project.eventDate) {
      upsertTrendPoint(projectTrendMap, project.eventDate, {
        fans: project.fans,
        adValue: project.adValue,
        bitlyClicks: project.bitlyClicks,
        engagementRate: project.engagementRate,
      });
    }

    return {
      projectId: project.projectId,
      eventName: project.eventName,
      eventDate: project.eventDate,
      partnerLabel: project.partnerLabel,
      primaryPartnerId: project.primaryPartnerId,
      primaryPartnerName: project.primaryPartnerName,
      viewSlug: project.viewSlug,
      sourceBreakdown: [
        {
          key: 'fans',
          label: 'Fans',
          value: project.fans,
          format: 'number' as const,
          source: 'analytics_aggregates.fanMetrics.totalFans',
        },
        {
          key: 'engagement',
          label: 'Engagement Rate',
          value: project.engagementRate,
          format: 'percentage' as const,
          source: 'analytics_aggregates.fanMetrics.engagementRate',
        },
        {
          key: 'adValue',
          label: 'Media Value',
          value: project.adValue,
          format: 'currency' as const,
          source: 'analytics_aggregates.adMetrics.totalROI',
        },
        {
          key: 'impressions',
          label: 'Tracked Impressions',
          value: matchingAggregate?.adMetrics?.totalImpressions || 0,
          format: 'number' as const,
          source: 'analytics_aggregates.adMetrics.totalImpressions',
        },
        {
          key: 'bitly',
          label: 'Bitly Clicks',
          value: bitly.clicks,
          format: 'number' as const,
          source: 'bitly_project_links.cachedMetrics.clicks',
        },
        {
          key: 'uniqueBitly',
          label: 'Unique Bitly Clicks',
          value: bitly.uniqueClicks,
          format: 'number' as const,
          source: 'bitly_project_links.cachedMetrics.uniqueClicks',
        },
      ],
      topCountries: summarizeMap(bitly.topCountries),
      topReferrers: summarizeMap(bitly.topReferrers),
      trend: finalizeTrendSeries(projectTrendMap),
      actions: {
        reportUrl: project.viewSlug ? `/report/${project.viewSlug}` : null,
        adminUrl: project.primaryPartnerId ? `/admin/partners/${project.primaryPartnerId}/analytics` : null,
        activationUrl: buildActivationUrl('project', project.projectId, rangePreset),
      },
    };
  });

  const partnerDrilldowns: SponsorshipPartnerDrilldown[] = [...partnerActivity.values()]
    .map((partner) => {
      const trendMap = new Map<string, TrendAccumulator>();
      partner.attributedProjects.forEach((project) => {
        upsertTrendPoint(trendMap, project.eventDate, {
          fans: project.fans,
          adValue: project.adValue,
          bitlyClicks: project.bitlyClicks,
          engagementRate: project.engagementRate,
        });
      });

      const partnerDoc = partnerMap.get(partner.partnerId);
      const avgEngagementRate = partner.engagementSamples > 0 ? partner.avgEngagementRate / partner.engagementSamples : 0;

      return {
        partnerId: partner.partnerId,
        name: partner.name,
        emoji: partner.emoji,
        eventCount: partner.eventCount,
        attributionBasis: 'primary_partner' as const,
        sourceBreakdown: [
          {
            key: 'fans',
            label: 'Attributed Fans',
            value: partner.totalFans,
            format: 'number' as const,
            source: 'analytics_aggregates.fanMetrics.totalFans',
          },
          {
            key: 'adValue',
            label: 'Attributed Media Value',
            value: partner.totalAdValue,
            format: 'currency' as const,
            source: 'analytics_aggregates.adMetrics.totalROI',
          },
          {
            key: 'bitly',
            label: 'Attributed Bitly Clicks',
            value: partner.totalBitlyClicks,
            format: 'number' as const,
            source: 'bitly_project_links.cachedMetrics.clicks',
          },
          {
            key: 'uniqueBitly',
            label: 'Attributed Unique Bitly Clicks',
            value: partner.totalBitlyUniqueClicks,
            format: 'number' as const,
            source: 'bitly_project_links.cachedMetrics.uniqueClicks',
          },
          {
            key: 'engagement',
            label: 'Average Engagement',
            value: avgEngagementRate,
            format: 'percentage' as const,
            source: 'analytics_aggregates.fanMetrics.engagementRate',
          },
        ],
        trend: finalizeTrendSeries(trendMap),
        attributedProjects: [...partner.attributedProjects].sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || '')),
        attributionSummary: `${partner.eventCount} project aggregates are attributed through analytics_aggregates.partnerContext.partnerId, with project partner1 fallback only when explicit aggregate context is missing.`,
        actions: {
          reportUrl: partnerDoc?.viewSlug ? `/partner-report/${partnerDoc.viewSlug}` : null,
          adminUrl: `/admin/partners/${partner.partnerId}/analytics`,
          activationUrl: buildActivationUrl('partner', partner.partnerId, rangePreset),
        },
      };
    })
    .sort((a, b) => {
      const scoreA = a.sourceBreakdown.find((item) => item.key === 'adValue')?.value || 0;
      const scoreB = b.sourceBreakdown.find((item) => item.key === 'adValue')?.value || 0;
      return scoreB - scoreA;
    });

  const proofItems: SponsorshipActivationProofItem[] = projectDrilldowns
    .map((project) => {
      const fanValue = project.sourceBreakdown.find((item) => item.key === 'fans')?.value || 0;
      const mediaValue = project.sourceBreakdown.find((item) => item.key === 'adValue')?.value || 0;
      const bitlyValue = project.sourceBreakdown.find((item) => item.key === 'bitly')?.value || 0;
      const hasReportLink = Boolean(project.actions.reportUrl);
      const missingReasons = [
        fanValue > 0 ? null : 'Missing fan evidence',
        mediaValue > 0 ? null : 'Missing media value',
        bitlyValue > 0 ? null : 'Missing Bitly evidence',
        hasReportLink ? null : 'Missing report link',
      ].filter(Boolean) as string[];
      const readinessHits = 4 - missingReasons.length;
      const readinessScore = (readinessHits / 4) * 100;
      const priorityScore = (mediaValue / 1000) + bitlyValue + (missingReasons.length * 500);
      const partnerDoc = project.primaryPartnerId ? partnerMap.get(project.primaryPartnerId) : null;
      return {
        projectId: project.projectId,
        eventName: project.eventName,
        eventDate: project.eventDate,
        partnerId: project.primaryPartnerId,
        partnerName: project.primaryPartnerName,
        partnerLabel: project.partnerLabel,
        fans: fanValue,
        adValue: mediaValue,
        bitlyClicks: bitlyValue,
        hasFanEvidence: fanValue > 0,
        hasMediaEvidence: mediaValue > 0,
        hasBitlyEvidence: bitlyValue > 0,
        hasReportLink,
        readinessScore,
        priorityScore,
        missingReasons,
        reportUrl: project.actions.reportUrl,
        projectAdminUrl: '/admin/events',
        partnerAnalyticsUrl: project.primaryPartnerId ? `/admin/partners/${project.primaryPartnerId}/analytics` : null,
        partnerReportUrl: partnerDoc?.viewSlug ? `/partner-report/${partnerDoc.viewSlug}` : null,
        activationUrl: project.actions.activationUrl,
      };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return (b.eventDate || '').localeCompare(a.eventDate || '');
    });

  const partnerQueueMap = new Map<string, SponsorshipActivationPartnerQueue>();
  proofItems.forEach((item) => {
    if (!item.partnerId) return;

    const current = partnerQueueMap.get(item.partnerId) || {
      partnerId: item.partnerId,
      name: item.partnerName || item.partnerLabel,
      emoji: partnerMap.get(item.partnerId)?.emoji,
      projectCount: 0,
      readyProjectCount: 0,
      gapProjectCount: 0,
      totalAdValue: 0,
      totalBitlyClicks: 0,
      actions: {
        reportUrl: item.partnerReportUrl,
        adminUrl: item.partnerAnalyticsUrl,
        activationUrl: buildActivationUrl('partner', item.partnerId, rangePreset),
      },
    };

    current.projectCount += 1;
    current.readyProjectCount += item.readinessScore === 100 ? 1 : 0;
    current.gapProjectCount += item.readinessScore === 100 ? 0 : 1;
    current.totalAdValue += item.adValue;
    current.totalBitlyClicks += item.bitlyClicks;
    partnerQueueMap.set(item.partnerId, current);
  });

  const partnerQueues = [...partnerQueueMap.values()].sort((a, b) => {
    if (b.gapProjectCount !== a.gapProjectCount) {
      return b.gapProjectCount - a.gapProjectCount;
    }
    return b.totalAdValue - a.totalAdValue;
  });

  const readyProjects = proofItems.filter(
    (item) => item.hasFanEvidence && item.hasMediaEvidence && item.hasBitlyEvidence && item.hasReportLink
  ).length;
  const needsBitlyProjects = proofItems.filter((item) => !item.hasBitlyEvidence).length;
  const needsReportProjects = proofItems.filter((item) => !item.hasReportLink).length;
  const readinessSamples = proofItems.length * 4;
  const readinessHits = proofItems.reduce((sum, item) => {
    return sum
      + Number(item.hasFanEvidence)
      + Number(item.hasMediaEvidence)
      + Number(item.hasBitlyEvidence)
      + Number(item.hasReportLink);
  }, 0);
  const readinessScore = readinessSamples > 0 ? (readinessHits / readinessSamples) * 100 : 0;

  const nextActions: string[] = [];
  if (needsBitlyProjects > 0) {
    nextActions.push(`Backfill Bitly coverage for ${needsBitlyProjects} project${needsBitlyProjects === 1 ? '' : 's'} that still lack tracked link evidence.`);
  }
  if (needsReportProjects > 0) {
    nextActions.push(`Create or restore report links for ${needsReportProjects} project${needsReportProjects === 1 ? '' : 's'} so proof packages can be shared externally.`);
  }
  if (proofItems.some((item) => !item.hasFanEvidence || !item.hasMediaEvidence)) {
    nextActions.push('Review projects with incomplete fan or media evidence before using them in sponsor recaps.');
  }
  if (nextActions.length === 0 && proofItems.length > 0) {
    nextActions.push('Activation proof coverage is healthy; proceed to partner-facing recap packaging and renewal workflows.');
  }

  return {
    scope: {
      type: scopeType,
      id: scopeId || null,
      name: scopeName,
      description: scopeDescription,
    },
    filters: {
      rangePreset,
      startDate,
      endDate,
    },
    summary: {
      eventCount: aggregates.length,
      partnerCount: topPartners.length,
      totalFans,
      totalImages,
      totalImpressions,
      totalAdValue,
      totalBitlyClicks: [...bitlyByProject.values()].reduce((sum, value) => sum + value.clicks, 0),
      totalBitlyUniqueClicks: [...bitlyByProject.values()].reduce((sum, value) => sum + value.uniqueClicks, 0),
      avgEngagementRate: aggregates.length > 0 ? totalEngagementRate / aggregates.length : 0,
      avgBitlyClickRate: aggregates.length > 0 ? totalBitlyClickRate / aggregates.length : 0,
      earliestEventDate,
      latestEventDate,
    },
    scopeActions: buildScopeActions(scopeType, scopeId || null, rangePreset, scopedPartner, scopedProject),
    channels: [
      {
        key: 'fan',
        label: 'Fan Engagement Evidence',
        primaryValue: totalFans,
        primaryFormat: 'number',
        secondaryLabel: 'Avg engagement rate',
        secondaryValue: aggregates.length > 0 ? totalEngagementRate / aggregates.length : 0,
        secondaryFormat: 'percentage',
        source: 'analytics_aggregates.fanMetrics',
        description: 'On-site and remote fan signals from event analytics.',
      },
      {
        key: 'media',
        label: 'Media Value Evidence',
        primaryValue: totalAdValue,
        primaryFormat: 'currency',
        secondaryLabel: 'Tracked impressions',
        secondaryValue: totalImpressions,
        secondaryFormat: 'number',
        source: 'analytics_aggregates.adMetrics',
        description: 'Calculated media value and impression estimates from event analytics.',
      },
      {
        key: 'bitly',
        label: 'Tracked Link Evidence',
        primaryValue: [...bitlyByProject.values()].reduce((sum, value) => sum + value.clicks, 0),
        primaryFormat: 'number',
        secondaryLabel: 'Avg Bitly click rate',
        secondaryValue: aggregates.length > 0 ? totalBitlyClickRate / aggregates.length : 0,
        secondaryFormat: 'percentage',
        source: 'bitly_project_links.cachedMetrics',
        description: 'Click-through evidence aggregated from Bitly link associations.',
      },
    ],
    coverage: {
      projectsWithBitly: [...bitlyByProject.values()].filter((value) => value.clicks > 0 || value.uniqueClicks > 0).length,
      projectsWithoutBitly: Math.max(projects.length - [...bitlyByProject.values()].filter((value) => value.clicks > 0 || value.uniqueClicks > 0).length, 0),
      bitlyCoverageRate: projects.length > 0
        ? ([...bitlyByProject.values()].filter((value) => value.clicks > 0 || value.uniqueClicks > 0).length / projects.length) * 100
        : 0,
    },
    trend: finalizeTrendSeries(scopeTrendMap),
    topProjects,
    topPartners,
    projectDrilldowns,
    partnerDrilldowns,
    activationWorkspace: {
      readinessScore,
      readyProjects,
      needsBitlyProjects,
      needsReportProjects,
      proofItems,
      partnerQueues,
      nextActions,
    },
  };
}
