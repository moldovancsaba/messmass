// One SZRT proof sample: confirm, reject, correct or restore it (PATCH), delete one a person added (DELETE).
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { getDb, handleRouteError } from '@/lib/fanmassIntegration';
import { deleteHumanEvidence, reviewEvidence, type ReviewDb } from '@/lib/szrtEvidenceReview';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const user = await getAdminUser();
    const doc = await reviewEvidence((await getDb()) as unknown as ReviewDb, decodeURIComponent(id), await request.json().catch(() => null), user?.email || user?.name || 'admin');
    return NextResponse.json({ success: true, row: { ...doc, id: doc._id } });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteHumanEvidence((await getDb()) as unknown as ReviewDb, decodeURIComponent(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
