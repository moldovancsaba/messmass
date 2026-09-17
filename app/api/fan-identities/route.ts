// app/api/fan-identities/route.ts
// WHAT: Create and list canonical fan identities (messmass#227, Phase A).
// WHY: Admin-only -- this is infrastructure for whoever builds the actual
//     collection touchpoint next (a ticketing webhook, a camera QR scan),
//     not a public-facing endpoint. No such touchpoint exists yet (checked
//     messmass and camera; neither captures a per-fan identifier today), so
//     this route's only real caller for now is an admin manually testing or
//     seeding the model.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { createFanIdentity, listFanIdentities, MissingConsentError, type FanIdentityConsent } from '@/lib/fanIdentity';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  const identities = await listFanIdentities(limit);
  return NextResponse.json({
    success: true,
    identities: identities.map((i) => ({ ...i, _id: i._id.toString(), mergedIntoId: i.mergedIntoId?.toString() })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const consent = body?.consent as FanIdentityConsent;
    const identity = await createFanIdentity(consent);
    return NextResponse.json({ success: true, identity: { ...identity, _id: identity._id.toString() } });
  } catch (error) {
    if (error instanceof MissingConsentError) {
      return NextResponse.json({ success: false, error: error.message, code: 'MISSING_CONSENT' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create fan identity.' }, { status: 500 });
  }
}
