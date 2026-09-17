// app/api/paid-campaigns/[id]/route.ts
// WHAT: Delete one paid campaign.
// WHY: messmass#226.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { deletePaidCampaign } from '@/lib/paidCampaigns';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const deleted = await deletePaidCampaign(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Paid campaign not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
