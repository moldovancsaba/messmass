// app/api/partners/[id]/lifecycle/route.ts
// WHAT: A partner's computed lifecycle stage, and the admin override for the
//     two stages with no data signal (proposal, postmortem).
// WHY: messmass#235.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getPartnershipLifecycle, setLifecycleOverride, type LifecycleOverride } from '@/lib/partnershipLifecycle';

const OVERRIDES: LifecycleOverride[] = ['proposal', 'postmortem'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const lifecycle = await getPartnershipLifecycle(id);
  if (!lifecycle) {
    return NextResponse.json({ success: false, error: 'Partner not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, lifecycle });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const override = body?.override;
    if (override !== null && !OVERRIDES.includes(override)) {
      return NextResponse.json({ success: false, error: `override must be one of: ${OVERRIDES.join(', ')}, or null to clear it.` }, { status: 400 });
    }
    const updated = await setLifecycleOverride(id, override);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Partner not found.' }, { status: 404 });
    }
    const lifecycle = await getPartnershipLifecycle(id);
    return NextResponse.json({ success: true, lifecycle });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update lifecycle override.' }, { status: 500 });
  }
}
