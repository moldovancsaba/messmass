// app/api/audience-packs/route.ts
// WHAT: List the four audience packs, seeding them (empty allowlists) on
//     first call if they don't exist yet.
// WHY: messmass#236.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { seedAudiencePacks, listAudiencePacks } from '@/lib/audiencePacks';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  await seedAudiencePacks();
  const packs = await listAudiencePacks();
  return NextResponse.json({ success: true, packs: packs.map((p) => ({ ...p, _id: p._id.toString() })) });
}
