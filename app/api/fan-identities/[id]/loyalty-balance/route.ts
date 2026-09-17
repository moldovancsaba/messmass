// app/api/fan-identities/[id]/loyalty-balance/route.ts
// WHAT: A fan's accumulated loyalty points and completion count.
// WHY: messmass#229. Lives under /api/fan-identities because it's a view
//     over a fan's own state, not a mission's -- mirrors how
//     /api/fan-identities/[id]/links already reads other fan-scoped data.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getFanIdentity } from '@/lib/fanIdentity';
import { getFanLoyaltyBalance } from '@/lib/loyaltyHub';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const identity = await getFanIdentity(id);
  if (!identity) {
    return NextResponse.json({ success: false, error: 'Fan identity not found.' }, { status: 404 });
  }
  const balance = await getFanLoyaltyBalance(id);
  return NextResponse.json({ success: true, balance });
}
