// lib/paidCampaigns.ts
// WHAT: Manually-entered paid campaign spend, juxtaposed against a project's
//     real organic evidence -- messmass#226, Phase A.
// WHY: There is no live paid-ad-platform integration anywhere in this
//     codebase (no Facebook/Google Ads credentials or API, checked before
//     designing this) -- decided 2026-09-17: track spend manually rather
//     than build against a platform with nothing to authenticate to.
// HOW: A campaign is scoped to one project (event), matching messmass's own
//     data granularity -- everything else here is per-event, not a
//     continuous marketing time series, so a campaign referencing an
//     arbitrary date range with no project would have nothing real to
//     juxtapose against. getUnifiedCampaignMeasurement deliberately does NOT
//     attribute specific clicks or fans to the paid campaign -- there is no
//     way to know which came from a paid push versus organic reach, and
//     claiming otherwise would be exactly the kind of unearned precision
//     #226's own disclosure fix (77c62e7c) already removed elsewhere.
//     Spend and organic evidence are reported side by side, both real,
//     neither pretending to explain the other.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { calculateFanMetrics, calculateAdMetrics, type ProjectStats } from '@/lib/analyticsCalculator';
import { getBitlyClicksForProject } from '@/lib/bitly-aggregator';

export type PaidCampaignPlatform = 'facebook' | 'google' | 'other';

export interface PaidCampaign {
  _id: ObjectId;
  name: string;
  platform: PaidCampaignPlatform;
  projectId: ObjectId;
  spend: number;
  currency: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(config.dbName).collection<PaidCampaign>('paid_campaigns');
}

export async function createPaidCampaign(input: {
  name: string;
  platform: PaidCampaignPlatform;
  projectId: string;
  spend: number;
  currency: string;
  notes?: string;
  createdBy: string;
}): Promise<PaidCampaign> {
  const collection = await getCollection();
  const now = new Date().toISOString();
  const doc: Omit<PaidCampaign, '_id'> = {
    name: input.name,
    platform: input.platform,
    projectId: new ObjectId(input.projectId),
    spend: input.spend,
    currency: input.currency,
    notes: input.notes,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc as PaidCampaign);
  return { ...doc, _id: result.insertedId } as PaidCampaign;
}

export async function listPaidCampaignsForProject(projectId: string): Promise<PaidCampaign[]> {
  if (!ObjectId.isValid(projectId)) return [];
  const collection = await getCollection();
  return collection.find({ projectId: new ObjectId(projectId) }).sort({ createdAt: -1 }).toArray();
}

export async function getPaidCampaign(id: string): Promise<PaidCampaign | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function deletePaidCampaign(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export interface OrganicEvidence {
  totalFans: number;
  totalMerched: number;
  bitlyClicks: number;
  /** From lib/analyticsCalculator.ts's calculateAdMetrics -- a synthetic estimate, not measured spend (#226's own disclosure). */
  estimatedOrganicValue: number;
}

export interface UnifiedCampaignMeasurement {
  campaign: PaidCampaign;
  organicEvidence: OrganicEvidence;
  /** null when there were no Bitly clicks to divide by -- not 0, which would read as "free" rather than "not computable". */
  costPerBitlyClick: number | null;
}

/** Pure -- the actual juxtaposition, given already-fetched inputs. */
export function computeUnifiedMeasurement(campaign: PaidCampaign, stats: Partial<ProjectStats>, bitlyClicks: number): UnifiedCampaignMeasurement {
  const normalized = {
    remoteImages: 0, hostessImages: 0, selfies: 0, stadium: 0,
    female: 0, male: 0, genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
    merched: 0, jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0,
    eventAttendees: 0,
    ...stats,
  } as ProjectStats;

  const fanMetrics = calculateFanMetrics(normalized);
  const adMetrics = calculateAdMetrics(normalized, fanMetrics);

  const organicEvidence: OrganicEvidence = {
    totalFans: fanMetrics.totalFans,
    totalMerched: normalized.merched,
    bitlyClicks,
    estimatedOrganicValue: adMetrics.totalROI,
  };

  return {
    campaign,
    organicEvidence,
    costPerBitlyClick: bitlyClicks > 0 ? campaign.spend / bitlyClicks : null,
  };
}

export async function getUnifiedCampaignMeasurement(campaignId: string): Promise<UnifiedCampaignMeasurement | null> {
  const campaign = await getPaidCampaign(campaignId);
  if (!campaign) return null;

  const client = await clientPromise;
  const db = client.db(config.dbName);
  const project = await db.collection('projects').findOne({ _id: campaign.projectId });
  const stats = (project?.stats || {}) as Partial<ProjectStats>;

  const bitlyClicks = await getBitlyClicksForProject(campaign.projectId.toString());

  return computeUnifiedMeasurement(campaign, stats, bitlyClicks);
}
