// app/api/loyalty-missions/[id]/route.ts
// WHAT: Read one mission with its sponsor-participation summary.
// WHY: messmass#229's "reporting on sponsor mission participation" check.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getLoyaltyMission, getMissionParticipation } from '@/lib/loyaltyHub';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const mission = await getLoyaltyMission(id);
  if (!mission) {
    return NextResponse.json({ success: false, error: 'Loyalty mission not found.' }, { status: 404 });
  }
  const participation = await getMissionParticipation(id);
  return NextResponse.json({ success: true, mission: { ...mission, _id: mission._id.toString() }, participation });
}
