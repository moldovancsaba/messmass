// app/api/paid-campaigns/route.ts
// WHAT: Create and list manually-entered paid campaigns for a project.
// WHY: messmass#226.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { createPaidCampaign, listPaidCampaignsForProject, type PaidCampaignPlatform } from '@/lib/paidCampaigns';

const PLATFORMS: PaidCampaignPlatform[] = ['facebook', 'google', 'other'];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const projectId = request.nextUrl.searchParams.get('projectId') || '';
  if (!ObjectId.isValid(projectId)) {
    return NextResponse.json({ success: false, error: 'A valid projectId query param is required.' }, { status: 400 });
  }
  const campaigns = await listPaidCampaignsForProject(projectId);
  return NextResponse.json({ success: true, campaigns: campaigns.map((c) => ({ ...c, _id: c._id.toString(), projectId: c.projectId.toString() })) });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const platform = body?.platform as PaidCampaignPlatform;
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    const spend = Number(body?.spend);
    const currency = typeof body?.currency === 'string' ? body.currency.trim() : '';

    if (!name) return NextResponse.json({ success: false, error: 'name is required.' }, { status: 400 });
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json({ success: false, error: `platform must be one of: ${PLATFORMS.join(', ')}` }, { status: 400 });
    }
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ success: false, error: 'A valid projectId is required.' }, { status: 400 });
    }
    if (!Number.isFinite(spend) || spend < 0) {
      return NextResponse.json({ success: false, error: 'spend must be a non-negative number.' }, { status: 400 });
    }
    if (!currency) return NextResponse.json({ success: false, error: 'currency is required.' }, { status: 400 });

    const admin = await getAdminUser();
    const campaign = await createPaidCampaign({
      name, platform, projectId, spend, currency,
      notes: typeof body?.notes === 'string' ? body.notes : undefined,
      createdBy: admin!.email,
    });
    return NextResponse.json({ success: true, campaign: { ...campaign, _id: campaign._id.toString(), projectId: campaign.projectId.toString() } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create paid campaign.' }, { status: 500 });
  }
}
