// app/api/loyalty-missions/[id]/completions/route.ts
// WHAT: Record a fan completing a mission (a scan-in, an attendance check,
//     a sponsor mission), or list a mission's completions.
// WHY: messmass#229. Every completion also writes a fan_identity_link
//     (messmass#227) -- the loyalty behavior becomes part of the fan's
//     identity graph, not a second, disconnected record of it.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { recordCompletion, listCompletions } from '@/lib/loyaltyHub';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const completions = await listCompletions(id);
  return NextResponse.json({
    success: true,
    completions: completions.map((c) => ({ ...c, _id: c._id.toString(), missionId: c.missionId.toString(), fanIdentityId: c.fanIdentityId.toString() })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const fanIdentityId = typeof body?.fanIdentityId === 'string' ? body.fanIdentityId : '';
    if (!fanIdentityId) {
      return NextResponse.json({ success: false, error: 'fanIdentityId is required.' }, { status: 400 });
    }
    const occurredAt = typeof body?.occurredAt === 'string' ? body.occurredAt : new Date().toISOString();

    const result = await recordCompletion(id, fanIdentityId, occurredAt);
    if ('error' in result) {
      const status = result.error === 'already_completed' ? 409 : 404;
      const error =
        result.error === 'mission_not_found' ? 'Loyalty mission not found.' :
        result.error === 'identity_not_found' ? 'Fan identity not found.' :
        'This fan has already completed this non-repeatable mission.';
      return NextResponse.json({ success: false, error, code: result.error.toUpperCase() }, { status });
    }
    return NextResponse.json({
      success: true,
      completion: { ...result, _id: result._id.toString(), missionId: result.missionId.toString(), fanIdentityId: result.fanIdentityId.toString() },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to record mission completion.' }, { status: 500 });
  }
}
