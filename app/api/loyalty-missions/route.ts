// app/api/loyalty-missions/route.ts
// WHAT: Create and list loyalty missions (quests, scan-ins, sponsor missions).
// WHY: messmass#229.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { createLoyaltyMission, listLoyaltyMissions, type LoyaltyMissionType } from '@/lib/loyaltyHub';

const MISSION_TYPES: LoyaltyMissionType[] = ['scan-in', 'attendance', 'sponsor-mission', 'digital-participation'];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const missions = await listLoyaltyMissions();
  return NextResponse.json({ success: true, missions: missions.map((m) => ({ ...m, _id: m._id.toString() })) });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const type = body?.type as LoyaltyMissionType;
    const pointsPerCompletion = Number(body?.pointsPerCompletion);

    if (!name) return NextResponse.json({ success: false, error: 'name is required.' }, { status: 400 });
    if (!MISSION_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: `type must be one of: ${MISSION_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!Number.isFinite(pointsPerCompletion) || pointsPerCompletion < 0) {
      return NextResponse.json({ success: false, error: 'pointsPerCompletion must be a non-negative number.' }, { status: 400 });
    }

    const admin = await getAdminUser();
    const mission = await createLoyaltyMission({
      name,
      description: typeof body?.description === 'string' ? body.description : undefined,
      type,
      partnerId: typeof body?.partnerId === 'string' ? body.partnerId : undefined,
      pointsPerCompletion,
      repeatable: Boolean(body?.repeatable),
      createdBy: admin!.email,
    });
    return NextResponse.json({ success: true, mission: { ...mission, _id: mission._id.toString() } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create loyalty mission.' }, { status: 500 });
  }
}
