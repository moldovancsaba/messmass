// app/api/integrations/fanmass/drive-folders/route.ts
// WHAT: Bulk discovery for fanmass — every event with >=1 linked Drive folder,
//       plus enough metadata (eventName, partnerIds, partnerNames) for fanmass
//       to auto-provision a batch via its existing upsert_messmass_batch(),
//       exactly like the camera path does. One bulk call instead of N
//       per-event context fetches: there's no existing "list linked events"
//       endpoint fanmass could poll cheaply, and a Drive-only event (no
//       camera link) would otherwise never be discovered.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listActiveDriveFoldersGroupedByEvent } from '@/lib/driveFolders';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const events = await listActiveDriveFoldersGroupedByEvent();
    return jsonSuccess({ events });
  } catch (err) {
    return handleRouteError(err);
  }
}
