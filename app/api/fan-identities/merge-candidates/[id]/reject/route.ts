// app/api/fan-identities/merge-candidates/[id]/reject/route.ts
// WHAT: Reject a flagged merge candidate -- the two identities stay separate.
// WHY: messmass#227. Admin-level (not superadmin): rejecting changes nothing
//     about existing data, unlike approving a merge.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { rejectMergeCandidate } from '@/lib/fanIdentity';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const admin = await getAdminUser();
  const rejected = await rejectMergeCandidate(id, admin!.email);
  if (!rejected) {
    return NextResponse.json({ success: false, error: 'Merge candidate not found or already reviewed.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
