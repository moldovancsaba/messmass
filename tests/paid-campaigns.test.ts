// tests/paid-campaigns.test.ts
// WHAT: computeUnifiedMeasurement -- the pure juxtaposition logic behind
//     messmass#226.
// WHY: The one thing this must never do is claim to attribute organic clicks
//     or fans to the paid spend -- it can only report both, honestly, side
//     by side. costPerBitlyClick being null (not 0) when there were no
//     clicks is the specific guard against reading "free" where the real
//     answer is "not computable".

import { ObjectId } from 'mongodb';
import { computeUnifiedMeasurement, type PaidCampaign } from '@/lib/paidCampaigns';
import type { ProjectStats } from '@/lib/analyticsCalculator';

function campaign(spend: number): PaidCampaign {
  return {
    _id: new ObjectId(),
    name: 'Test Campaign',
    platform: 'facebook',
    projectId: new ObjectId(),
    spend,
    currency: 'EUR',
    createdBy: 'admin@example.com',
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  };
}

describe('computeUnifiedMeasurement', () => {
  it('reports real organic evidence alongside the campaign, not attributed to it', () => {
    const result = computeUnifiedMeasurement(campaign(1000), { stadium: 500, merched: 80 } as Partial<ProjectStats>, 200);
    expect(result.campaign.spend).toBe(1000);
    expect(result.organicEvidence.totalFans).toBe(500);
    expect(result.organicEvidence.totalMerched).toBe(80);
    expect(result.organicEvidence.bitlyClicks).toBe(200);
  });

  it('computes cost per Bitly click when there were real clicks', () => {
    const result = computeUnifiedMeasurement(campaign(1000), {} as Partial<ProjectStats>, 200);
    expect(result.costPerBitlyClick).toBe(5);
  });

  it('cost per click is null, not 0, when there were no clicks at all', () => {
    const result = computeUnifiedMeasurement(campaign(1000), {} as Partial<ProjectStats>, 0);
    expect(result.costPerBitlyClick).toBeNull();
  });

  it('never produces NaN even from a completely empty stats object', () => {
    const result = computeUnifiedMeasurement(campaign(500), {}, 0);
    expect(Number.isFinite(result.organicEvidence.totalFans)).toBe(true);
    expect(Number.isFinite(result.organicEvidence.estimatedOrganicValue)).toBe(true);
  });

  // The same synthetic estimate messmass#226 already disclosed, not a new figure.
  it('estimatedOrganicValue is a positive number derived from real engagement counts', () => {
    const result = computeUnifiedMeasurement(campaign(0), { remoteImages: 100, hostessImages: 0, selfies: 0 } as Partial<ProjectStats>, 0);
    // Non-zero images produce a non-zero social value estimate via the shared calculateAdMetrics.
    expect(result.organicEvidence.estimatedOrganicValue).toBeGreaterThan(0);
  });
});
