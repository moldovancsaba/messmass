// app/api/integrations/fanmass/event-hashtags/route.ts
// WHAT: Fanmass adds campaign hashtags to Messmass events (lib/fanmassEventHashtags.ts), additive only.
// WHY: Owner 2026-11-14: "Tippmix has to be added to the events", automatically, without an admin session. Only the
//     Fanmass integration token reaches this route; it never removes or replaces a hashtag.

import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { addEventHashtags, parseEventHashtagsRequest } from '@/lib/fanmassEventHashtags';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const input = parseEventHashtagsRequest(await request.json().catch(() => null));
    return jsonSuccess(await addEventHashtags(await getDb(), input));
  } catch (err) {
    return handleRouteError(err);
  }
}
