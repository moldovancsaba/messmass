// app/api/fan-identities/merge-candidates/[id]/approve/route.ts
// WHAT: The one action that actually merges two fan identities.
// WHY: messmass#227. Superadmin-only, not admin -- this is the action that
//     can misattribute one real person's data to another if the flagged
//     match is wrong. See lib/apiGuards.ts's requireSuperadmin.

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { approveMergeCandidate } from '@/lib/fanIdentity';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperadmin();
  if (denied) return denied;

  const { id } = await params;
  const admin = await getAdminUser();
  const merged = await approveMergeCandidate(id, admin!.email);
  if (!merged) {
    return NextResponse.json({ success: false, error: 'Merge candidate not found or already reviewed.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
