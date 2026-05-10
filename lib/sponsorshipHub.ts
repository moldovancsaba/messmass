import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

export type SponsorshipHubScopeType = 'portfolio' | 'partner' | 'organization' | 'project';
export type SponsorshipHubRangePreset = 'all' | '30d' | '90d' | '365d';

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
  };
};

export interface SponsorshipHubRequest {
  scopeType: SponsorshipHubScopeType;
  scopeId?: string | null;
  rangePreset?: SponsorshipHubRangePreset;
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
  channels: Array<{
    key: 'fan' | 'media' | 'bitly';
    label: string;
    primaryValue: number;
    primaryFormat: 'number' | 'currency' | 'percentage';
    secondaryLabel: string;
    secondaryValue: number;
    secondaryFormat: 'number' | 'currency' | 'percentage';
    source: string;
    description: string;
  }>;
  coverage: {
    projectsWithBitly: number;
    projectsWithoutBitly: number;
    bitlyCoverageRate: number;
  };
  topProjects: Array<{
    projectId: string;
    eventName: string;
    eventDate: string | null;
    partnerLabel: string;
    fans: number;
    adValue: number;
    bitlyClicks: number;
    engagementRate: number;
    viewSlug: string | null;
  }>;
  topPartners: Array<{
    partnerId: string;
    name: string;
    emoji?: string;
    eventCount: number;
    totalFans: number;
    totalAdValue: number;
    totalBitlyClicks: number;
    avgEngagementRate: number;
    attributionBasis: 'primary_partner';
  }>;
}

type TopProjectAccumulator = SponsorshipHubResponse['topProjects'][number] & {
  engagementSamples: number;
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

function resolveDateRange(rangePreset: SponsorshipHubRangePreset) {
  if (rangePreset === 'all') {
    return {
      startDate: null,
      endDate: null,
    };
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
    topProjects: [],
    topPartners: [],
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

  if (scopeType === 'partner') {
    const partnerId = toObjectId(scopeId || '', 'partner id');
    const partner = await partnersCollection.findOne({ _id: partnerId });
    if (!partner) {
      throw new Error('Partner not found');
    }

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

    const partners = await partnersCollection
      .find({ organizationId })
      .project({ _id: 1 })
      .toArray();
    const partnerIds = partners.map((partner) => partner._id);

    scopeName = organization.name;
    scopeDescription = 'Unified sponsorship performance for all partner members assigned to this organization.';

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

    scopeName = project.eventName || 'Selected project';
    scopeDescription = 'Unified sponsorship performance for a single project.';
    projects = [project];
  }

  let aggregates: AnalyticsAggregate[] = [];
  let projectMap = new Map<string, ProjectRecord>();

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

    aggregates = (await aggregatesCollection
      .find(aggregateQuery)
      .sort({ eventDate: -1 })
      .toArray()).filter(isEventAggregate);

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

      aggregates = (await aggregatesCollection
        .find(aggregateQuery)
        .sort({ eventDate: -1 })
        .toArray()).filter(isEventAggregate);
    }
  }

  if (projects.length === 0 && aggregates.length === 0) {
    return emptyHub(scopeType, scopeId || null, scopeName, scopeDescription, rangePreset, startDate, endDate);
  }

  projectMap = new Map(projects.map((project) => [project._id.toString(), project]));

  const allPartnerIds = new Set<string>();
  projects.forEach((project) => {
    const partner1Id = normalizeObjectId(project.partner1 || project.partner1Id);
    const partner2Id = normalizeObjectId(project.partner2 || project.partner2Id);
    if (partner1Id) allPartnerIds.add(partner1Id);
    if (partner2Id) allPartnerIds.add(partner2Id);
  });

  const partnerDocuments = allPartnerIds.size > 0
    ? await partnersCollection
        .find({ _id: { $in: [...allPartnerIds].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } })
        .project({ _id: 1, name: 1, emoji: 1 })
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

  const bitlyByProject = new Map<string, { clicks: number; uniqueClicks: number }>();
  bitlyAssociations.forEach((association) => {
    const key = association.projectId.toString();
    const current = bitlyByProject.get(key) || { clicks: 0, uniqueClicks: 0 };
    current.clicks += association.cachedMetrics?.clicks || 0;
    current.uniqueClicks += association.cachedMetrics?.uniqueClicks || 0;
    bitlyByProject.set(key, current);
  });

  const topProjectMap = new Map<string, TopProjectAccumulator>();
  const partnerActivity = new Map<string, SponsorshipHubResponse['topPartners'][number] & { engagementSamples: number }>();
  let totalFans = 0;
  let totalImages = 0;
  let totalImpressions = 0;
  let totalAdValue = 0;
  let totalEngagementRate = 0;
  let totalBitlyClickRate = 0;
  let earliestEventDate: string | null = null;
  let latestEventDate: string | null = null;

  const ensurePartnerAccumulator = (partnerId: string, fallbackName?: string) => {
    const partner = partnerMap.get(partnerId);
    return partnerActivity.get(partnerId) || {
      partnerId,
      name: partner?.name || fallbackName || 'Unknown partner',
      emoji: partner?.emoji,
      eventCount: 0,
      totalFans: 0,
      totalAdValue: 0,
      totalBitlyClicks: 0,
      avgEngagementRate: 0,
      attributionBasis: 'primary_partner' as const,
      engagementSamples: 0,
    };
  };

  aggregates.forEach((aggregate) => {
    const projectId = aggregate.projectId.toString();
    const project = projectMap.get(projectId);
    const bitly = bitlyByProject.get(projectId) || { clicks: 0, uniqueClicks: 0 };
    const projectEventDate = aggregate.eventDate || project?.eventDate || null;
    const partnerLabel = aggregate.partnerContext?.partnerName
      || project?.partner1Name
      || project?.partner2Name
      || 'Unassigned partner';

    totalFans += aggregate.fanMetrics?.totalFans || 0;
    totalImages += (aggregate.rawStats?.remoteImages || 0) + (aggregate.rawStats?.hostessImages || 0) + (aggregate.rawStats?.selfies || 0);
    totalImpressions += aggregate.adMetrics?.totalImpressions || 0;
    totalAdValue += aggregate.adMetrics?.totalROI || 0;
    totalEngagementRate += aggregate.fanMetrics?.engagementRate || 0;
    totalBitlyClickRate += aggregate.bitlyMetrics?.clickRate || 0;

    if (projectEventDate) {
      if (!earliestEventDate || projectEventDate < earliestEventDate) earliestEventDate = projectEventDate;
      if (!latestEventDate || projectEventDate > latestEventDate) latestEventDate = projectEventDate;
    }

    const currentProject = topProjectMap.get(projectId) || {
      projectId,
      eventName: project?.eventName || 'Untitled event',
      eventDate: project?.eventDate || projectEventDate,
      partnerLabel,
      fans: 0,
      adValue: 0,
      bitlyClicks: bitly.clicks,
      engagementRate: 0,
      viewSlug: project?.viewSlug || null,
      engagementSamples: 0,
    };

    currentProject.fans += aggregate.fanMetrics?.totalFans || 0;
    currentProject.adValue += aggregate.adMetrics?.totalROI || 0;
    currentProject.engagementRate += aggregate.fanMetrics?.engagementRate || 0;
    currentProject.engagementSamples += 1;
    currentProject.bitlyClicks = bitly.clicks;
    topProjectMap.set(projectId, currentProject);

    const attributedPartnerId =
      normalizeObjectId(aggregate.partnerContext?.partnerId) ||
      normalizeObjectId(project?.partner1 || project?.partner1Id);
    if (attributedPartnerId) {
      const attributedPartner = ensurePartnerAccumulator(
        attributedPartnerId,
        aggregate.partnerContext?.partnerName || project?.partner1Name
      );
      attributedPartner.totalFans += aggregate.fanMetrics?.totalFans || 0;
      attributedPartner.totalAdValue += aggregate.adMetrics?.totalROI || 0;
      attributedPartner.totalBitlyClicks += bitly.clicks;
      attributedPartner.avgEngagementRate += aggregate.fanMetrics?.engagementRate || 0;
      attributedPartner.engagementSamples += 1;
      partnerActivity.set(attributedPartnerId, attributedPartner);
    }
  });

  projects.forEach((project) => {
    const primaryPartnerId = normalizeObjectId(project.partner1 || project.partner1Id);
    if (!primaryPartnerId) return;

    const current = ensurePartnerAccumulator(primaryPartnerId, project.partner1Name);
    current.eventCount += 1;
    partnerActivity.set(primaryPartnerId, current);
  });

  const totalBitlyClicks = [...bitlyByProject.values()].reduce((sum, item) => sum + item.clicks, 0);
  const totalBitlyUniqueClicks = [...bitlyByProject.values()].reduce((sum, item) => sum + item.uniqueClicks, 0);
  const eventCount = aggregates.length;
  const avgEngagementRate = eventCount > 0 ? totalEngagementRate / eventCount : 0;
  const avgBitlyClickRate = eventCount > 0 ? totalBitlyClickRate / eventCount : 0;
  const projectsWithBitly = [...bitlyByProject.values()].filter((item) => item.clicks > 0 || item.uniqueClicks > 0).length;
  const projectsWithoutBitly = Math.max(projectMap.size - projectsWithBitly, 0);
  const bitlyCoverageRate = projectMap.size > 0 ? (projectsWithBitly / projectMap.size) * 100 : 0;

  const channels: SponsorshipHubResponse['channels'] = [
    {
      key: 'fan',
      label: 'Fan Engagement Evidence',
      primaryValue: totalFans,
      primaryFormat: 'number',
      secondaryLabel: 'Avg engagement rate',
      secondaryValue: avgEngagementRate,
      secondaryFormat: 'percentage',
      source: 'analytics_aggregates.fanMetrics',
      description: 'On-site and remote fan signals rolled up from event aggregates.',
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
      description: 'Estimated sponsorship media value and impression volume from event analytics.',
    },
    {
      key: 'bitly',
      label: 'Tracked Link Evidence',
      primaryValue: totalBitlyClicks,
      primaryFormat: 'number',
      secondaryLabel: 'Avg Bitly click rate',
      secondaryValue: avgBitlyClickRate,
      secondaryFormat: 'percentage',
      source: 'bitly_project_links.cachedMetrics',
      description: 'Tracked click-through evidence from associated Bitly links.',
    },
  ];

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
      eventCount,
      partnerCount: partnerActivity.size,
      totalFans: Math.round(totalFans),
      totalImages: Math.round(totalImages),
      totalImpressions: Math.round(totalImpressions),
      totalAdValue: Math.round(totalAdValue),
      totalBitlyClicks: Math.round(totalBitlyClicks),
      totalBitlyUniqueClicks: Math.round(totalBitlyUniqueClicks),
      avgEngagementRate: Math.round(avgEngagementRate * 10) / 10,
      avgBitlyClickRate: Math.round(avgBitlyClickRate * 10) / 10,
      earliestEventDate,
      latestEventDate,
    },
    channels,
    coverage: {
      projectsWithBitly,
      projectsWithoutBitly,
      bitlyCoverageRate: Math.round(bitlyCoverageRate * 10) / 10,
    },
    topProjects: [...topProjectMap.values()]
      .map((project) => ({
        ...project,
        engagementRate: project.engagementSamples > 0
          ? Math.round((project.engagementRate / project.engagementSamples) * 10) / 10
          : 0,
      }))
      .sort((a, b) => (b.adValue + b.bitlyClicks) - (a.adValue + a.bitlyClicks))
      .slice(0, 8),
    topPartners: [...partnerActivity.values()]
      .map((partner) => ({
        ...partner,
        avgEngagementRate: partner.engagementSamples > 0
          ? Math.round((partner.avgEngagementRate / partner.engagementSamples) * 10) / 10
          : 0,
      }))
      .sort((a, b) => {
        const scoreA = a.totalAdValue + a.totalBitlyClicks;
        const scoreB = b.totalAdValue + b.totalBitlyClicks;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.eventCount - a.eventCount;
      })
      .slice(0, 8),
  };
}
