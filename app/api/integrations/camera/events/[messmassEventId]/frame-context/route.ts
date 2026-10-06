// app/api/integrations/camera/events/[messmassEventId]/frame-context/route.ts
// WHAT: Everything camera needs to build the default frame of one event, already resolved (event, home and
//     visitor teams with logos, partner, template, effective report style and font). See lib/cameraFrameContext.ts.
// WHY: camera generates a frame for every event (camera#231); it must not re-implement the template and style
//     resolution or guess the system default style.
// AUTH: the same shared secret as the other camera routes (CAMERA_MESSMASS_INTERNAL_SECRET), via assertCameraSecret.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { assertCameraSecret } from '@/lib/cameraClient';
import { buildCameraFrameContext } from '@/lib/cameraFrameContext';
import { getDb } from '@/lib/db';
import { error as logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ messmassEventId: string }> }
) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  const { messmassEventId } = await context.params;
  if (!ObjectId.isValid(messmassEventId)) {
    return NextResponse.json({ success: false, error: 'invalid_event_id' }, { status: 400 });
  }

  try {
    const frameContext = await buildCameraFrameContext(await getDb(), messmassEventId);
    if (!frameContext) {
      return NextResponse.json({ success: false, error: 'event_not_found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...frameContext });
  } catch (error) {
    logError('Camera frame context failed', { messmassEventId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'frame_context_failed' }, { status: 500 });
  }
}
