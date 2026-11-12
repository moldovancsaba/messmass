// Review page of the SZRT proof samples: list them (weakest first), and add a sample of your own.
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { getDb, handleRouteError } from '@/lib/fanmassIntegration';
import { createHumanEvidence, listEvidenceForReview, type ReviewDb } from '@/lib/szrtEvidenceReview';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const q = new URL(request.url).searchParams;
    const result = await listEvidenceForReview((await getDb()) as unknown as ReviewDb, {
      status: q.get('status') || undefined, kind: q.get('kind') || undefined, name: q.get('name') || undefined,
      limit: Number(q.get('limit')) || undefined, offset: Number(q.get('offset')) || undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const user = await getAdminUser();
    const doc = await createHumanEvidence((await getDb()) as unknown as ReviewDb, await request.json().catch(() => null), user?.email || user?.name || 'admin');
    return NextResponse.json({ success: true, row: { ...doc, id: doc._id } }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
