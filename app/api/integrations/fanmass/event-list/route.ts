// app/api/integrations/fanmass/event-list/route.ts
// WHAT: Every Messmass event's id, name and date, for Fanmass (lib/fanmassEventHashtags.ts listEvents).
// WHY: Owner 2026-11-14: every event of the SZRT campaign must carry #tippmixreport2026; half of the campaign games have
//     no Camera link, so Fanmass finds their Messmass event by date and clubs here. Fanmass token only; no stats.

import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listEvents } from '@/lib/fanmassEventHashtags';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    return jsonSuccess({ events: await listEvents(await getDb()) });
  } catch (err) {
    return handleRouteError(err);
  }
}
