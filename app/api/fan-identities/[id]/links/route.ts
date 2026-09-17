// app/api/fan-identities/[id]/links/route.ts
// WHAT: Attach or list behavior links for one fan identity -- the "canonical
//     event, activation, and engagement event schema" the issue asks for.
// WHY: messmass#227.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { addFanIdentityLink, listFanIdentityLinks, type FanIdentityLinkType } from '@/lib/fanIdentity';

const LINK_TYPES: FanIdentityLinkType[] = ['ticketing', 'activation', 'engagement', 'report-interaction'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const links = await listFanIdentityLinks(id);
  return NextResponse.json({
    success: true,
    links: links.map((l) => ({ ...l, _id: l._id.toString(), fanIdentityId: l.fanIdentityId.toString() })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const linkType = body?.linkType as FanIdentityLinkType;
    if (!LINK_TYPES.includes(linkType)) {
      return NextResponse.json({ success: false, error: `linkType must be one of: ${LINK_TYPES.join(', ')}` }, { status: 400 });
    }
    const sourceRef = body?.sourceRef;
    if (!sourceRef?.collection || !sourceRef?.id) {
      return NextResponse.json({ success: false, error: 'sourceRef.collection and sourceRef.id are required.' }, { status: 400 });
    }
    const occurredAt = typeof body?.occurredAt === 'string' ? body.occurredAt : new Date().toISOString();

    const link = await addFanIdentityLink(id, { linkType, sourceRef, occurredAt, evidence: body?.evidence });
    if (!link) {
      return NextResponse.json({ success: false, error: 'Fan identity not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, link: { ...link, _id: link._id.toString(), fanIdentityId: link.fanIdentityId.toString() } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to add fan identity link.' }, { status: 500 });
  }
}
