// app/api/integrations/camera/events/[messmassEventId]/photo-stats/route.ts
// WHAT: POST the photo, people and journey counters camera measured for one event (camera#521). Every counter lands on the event stats under a name that
//     starts with `camera_` (camera_images_approved, camera_gender_female, ...) as camera's whole running total, and is registered in the variable catalog
//     (lib/cameraPhotoStats.ts).
// WHY: The analytics of an event should say how many photos were taken and approved and who is in them, which only camera knows. The names are camera's own
//     and never an existing variable's, so nothing an operator typed or another source delivered can be changed by this route.
// AUTH: the same shared secret as the other camera routes (CAMERA_MESSMASS_INTERNAL_SECRET), via assertCameraSecret.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { assertCameraSecret } from '@/lib/cameraClient';
import { applyPhotoStats, parsePhotoStats, registerPhotoStatVariables } from '@/lib/cameraPhotoStats';
import { getDb } from '@/lib/db';
import { error as logError } from '@/lib/logger';

// The id as camera stores it: 24 hex characters. ObjectId.isValid would also pass any 12 character text.
const EVENT_ID = /^[0-9a-f]{24}$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ messmassEventId: string }> }
) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  const { messmassEventId } = await context.params;
  if (!EVENT_ID.test(messmassEventId)) {
    return NextResponse.json({ success: false, error: 'invalid_event_id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parsePhotoStats(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: 'invalid_photo_stats', detail: parsed.error }, { status: 400 });
  }

  const db = await getDb().catch((error) => {
    logError('Camera photo stats: no database', { messmassEventId }, error instanceof Error ? error : new Error(String(error)));
    return null;
  });
  if (!db) return NextResponse.json({ success: false, error: 'photo_stats_failed' }, { status: 500 });

  const now = new Date().toISOString();
  try {
    const found = await applyPhotoStats(db.collection('projects'), new ObjectId(messmassEventId), parsed.value, now);
    if (!found) {
      return NextResponse.json({ success: false, error: 'event_not_found' }, { status: 404 });
    }
  } catch (error) {
    logError('Camera photo stats failed', { messmassEventId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'photo_stats_failed' }, { status: 500 });
  }

  // The values are stored. A catalog failure must not undo that (the next push registers again); it is logged and told to the caller.
  let catalog: 'registered' | 'failed' = 'registered';
  try {
    await registerPhotoStatVariables(db.collection('variables_metadata'), parsed.value, now);
  } catch (error) {
    catalog = 'failed';
    logError('Camera photo stats: catalog registration failed', { messmassEventId }, error instanceof Error ? error : new Error(String(error)));
  }

  return NextResponse.json({ success: true, totals: parsed.value.totals, averages: parsed.value.averages, catalog });
}
