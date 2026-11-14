// app/api/integrations/fanmass/events/[eventId]/drive-photos/route.ts
// WHAT: Fanmass sends the drive photos it placed in this event and the ids of photos that left it (lib/fanmassDrivePhotos.ts),
//     up to 500 of each per request.
// WHY: The SZRT drive library carries no event; Fanmass placed every photo in an event by the owner's rule, and the
//     hashtag report counts them for that event. Only the Fanmass integration token reaches this route.

import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { parseDrivePhotos, storeDrivePhotos } from '@/lib/fanmassDrivePhotos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId } = await context.params;
    const { photos, remove } = parseDrivePhotos(await request.json().catch(() => null), eventId);
    const { stored, removed } = await storeDrivePhotos(await getDb(), eventId, photos, remove);
    return jsonSuccess({ eventId, stored, removed });
  } catch (err) {
    return handleRouteError(err);
  }
}
