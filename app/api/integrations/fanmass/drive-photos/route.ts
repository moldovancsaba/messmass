// app/api/integrations/fanmass/drive-photos/route.ts
// WHAT: Fanmass sends the drive photos that sit in no Messmass event (lib/fanmassDrivePhotos.ts), up to 500 per request.
// WHY: Every drive photo is recorded with its hashtags, not only the ones placed in an event: a photo still waiting for
//     evidence, or placed in a fixture with no Messmass event, is found by its hashtags. Only the Fanmass integration
//     token reaches this route.

import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { parseDrivePhotos, storeDrivePhotos } from '@/lib/fanmassDrivePhotos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { photos, remove } = parseDrivePhotos(await request.json().catch(() => null), null);
    const { stored, removed } = await storeDrivePhotos(await getDb(), null, photos, remove);
    return jsonSuccess({ eventId: null, stored, removed });
  } catch (err) {
    return handleRouteError(err);
  }
}
