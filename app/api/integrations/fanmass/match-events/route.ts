// app/api/integrations/fanmass/match-events/route.ts
// WHAT: Fanmass creates the Messmass event of a sports match it holds photos of (lib/fanmassMatchEvents.ts).
// WHY: The event is made exactly as Quick Add's match builder makes it, including its Camera mirror, so a game that
//     had no Messmass event gets one without an admin session. Only the Fanmass integration token reaches this route;
//     the same match on the same date is never created twice.

import { NextRequest, after } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { createMatchEvent, parseMatchEventRequest } from '@/lib/fanmassMatchEvents';
import { error as logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const input = parseMatchEventRequest(await request.json().catch(() => null));
    const db = await getDb();
    const { created, eventId, eventName, project } = await createMatchEvent(db, input);
    if (created) {
      // The Camera mirror, as POST /api/projects does it: after the response, never blocking the create
      after(async () => {
        try {
          const { provisionCameraEventForProject } = await import('@/lib/cameraProvision');
          await provisionCameraEventForProject(db, project);
        } catch (err) {
          logError('Camera provisioning failed', { context: 'fanmass-match-events', projectId: eventId }, err instanceof Error ? err : new Error(String(err)));
        }
      });
    }
    return jsonSuccess({ created, eventId, eventName, eventDate: input.eventDate }, created ? 201 : 200);
  } catch (err) {
    return handleRouteError(err);
  }
}
