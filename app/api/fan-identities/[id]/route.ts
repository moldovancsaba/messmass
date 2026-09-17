// app/api/fan-identities/[id]/route.ts
// WHAT: Read or permanently delete one fan identity.
// WHY: DELETE is a real deletion (identity + its links), not a status flag --
//     right-to-deletion is a real legal obligation this feature creates
//     (messmass#227 audit), not something a soft-delete flag satisfies.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getFanIdentity, deleteFanIdentity, listFanIdentityLinks } from '@/lib/fanIdentity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const identity = await getFanIdentity(id);
  if (!identity) {
    return NextResponse.json({ success: false, error: 'Fan identity not found.' }, { status: 404 });
  }
  const links = await listFanIdentityLinks(id);
  return NextResponse.json({
    success: true,
    identity: { ...identity, _id: identity._id.toString(), mergedIntoId: identity.mergedIntoId?.toString() },
    links: links.map((l) => ({ ...l, _id: l._id.toString(), fanIdentityId: l.fanIdentityId.toString() })),
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const deleted = await deleteFanIdentity(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Fan identity not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
