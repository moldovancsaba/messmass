// app/api/paid-campaigns/[id]/measurement/route.ts
// WHAT: The unified paid + organic view for one campaign.
// WHY: messmass#226. Real paid spend and real organic evidence, side by
//     side -- never claimed as causally attributed to each other.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getUnifiedCampaignMeasurement } from '@/lib/paidCampaigns';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const measurement = await getUnifiedCampaignMeasurement(id);
  if (!measurement) {
    return NextResponse.json({ success: false, error: 'Paid campaign not found.' }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    campaign: { ...measurement.campaign, _id: measurement.campaign._id.toString(), projectId: measurement.campaign.projectId.toString() },
    organicEvidence: measurement.organicEvidence,
    costPerBitlyClick: measurement.costPerBitlyClick,
  });
}
