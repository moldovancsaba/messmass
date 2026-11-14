// app/api/integrations/fanmass/fanmass-hashtags/route.ts
// WHAT: Fanmass asks Messmass to recompute every event's Fanmass hashtags from its photos (lib/fanmassEventHashtags.ts).
// WHY: Owner 2026-11-14: the hashtags the local AI writes (brands, clubs, people, emotions, sport...) belong to the event
//     too, next to the typed ones and never mixed into them. Fanmass calls this after every publish run.

import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { refreshFanmassHashtags } from '@/lib/fanmassEventHashtags';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    return jsonSuccess(await refreshFanmassHashtags(await getDb()));
  } catch (err) {
    return handleRouteError(err);
  }
}
