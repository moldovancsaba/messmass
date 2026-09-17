// app/api/fan-identities/merge-candidates/route.ts
// WHAT: The governed-merge review queue. POST flags two identities as
//     possibly the same fan; nothing merges automatically -- see
//     lib/fanIdentity.ts's module comment for why.
// WHY: messmass#227's own "Out of Scope" section rules out automatic
//     identity stitching in the first version; this is that boundary as code.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { flagMergeCandidate, listMergeCandidates, type MergeCandidateStatus } from '@/lib/fanIdentity';

const STATUSES: MergeCandidateStatus[] = ['pending', 'approved', 'rejected'];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const statusParam = (request.nextUrl.searchParams.get('status') || 'pending') as MergeCandidateStatus;
  const status = STATUSES.includes(statusParam) ? statusParam : 'pending';
  const candidates = await listMergeCandidates(status);
  return NextResponse.json({
    success: true,
    candidates: candidates.map((c) => ({ ...c, _id: c._id.toString(), identityIds: c.identityIds.map((i) => i.toString()) })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { identityIdA, identityIdB, evidence } = body || {};
    if (typeof identityIdA !== 'string' || typeof identityIdB !== 'string' || !evidence?.trim()) {
      return NextResponse.json({ success: false, error: 'identityIdA, identityIdB, and evidence are required.' }, { status: 400 });
    }
    const admin = await getAdminUser();
    const candidate = await flagMergeCandidate(identityIdA, identityIdB, evidence, admin!.email);
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Invalid or identical identity ids.' }, { status: 400 });
    }
    return NextResponse.json({ success: true, candidate: { ...candidate, _id: candidate._id.toString(), identityIds: candidate.identityIds.map((i) => i.toString()) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to flag merge candidate.' }, { status: 500 });
  }
}
