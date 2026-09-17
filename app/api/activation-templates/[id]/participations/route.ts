// app/api/activation-templates/[id]/participations/route.ts
// WHAT: Record a fan's participation in an activation, or list them.
// WHY: messmass#228. Every recorded participation also writes a
//     fan_identity_link (messmass#227) -- that's the "linkage from
//     activation outcomes to partner/project reporting" the issue asks for.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { recordParticipation, listParticipations } from '@/lib/activationBuilder';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const participations = await listParticipations(id);
  return NextResponse.json({
    success: true,
    participations: participations.map((p) => ({ ...p, _id: p._id.toString(), templateId: p.templateId.toString(), fanIdentityId: p.fanIdentityId.toString() })),
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
    const responses = body?.responses && typeof body.responses === 'object' ? body.responses : {};
    const occurredAt = typeof body?.occurredAt === 'string' ? body.occurredAt : new Date().toISOString();

    const result = await recordParticipation(id, fanIdentityId, responses, occurredAt);
    if ('error' in result) {
      const status = result.error === 'invalid_responses' ? 400 : 404;
      const error =
        result.error === 'template_not_found' ? 'Activation template not found.' :
        result.error === 'identity_not_found' ? 'Fan identity not found.' :
        `Invalid responses: ${result.issues!.join('; ')}`;
      return NextResponse.json({ success: false, error, code: result.error.toUpperCase() }, { status });
    }
    return NextResponse.json({
      success: true,
      participation: { ...result, _id: result._id.toString(), templateId: result.templateId.toString(), fanIdentityId: result.fanIdentityId.toString() },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to record participation.' }, { status: 500 });
  }
}
