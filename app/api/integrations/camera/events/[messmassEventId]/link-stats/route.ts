// app/api/integrations/camera/events/[messmassEventId]/link-stats/route.ts
// WHAT: POST the scan and click totals camera measured on the tracked short links of one event (camera#320). They land on the stats visitQrCode,
//     visitShortUrl, qrscanAndroid and qrscanIphone as the value the stat held at the first report plus camera's total (lib/cameraLinkStats.ts).
// WHY: The analytics of an event must include the people who came in through the QR codes on the giant screen, the posters and the emails, which only
//     camera can count.
// AUTH: the same shared secret as the other camera routes (CAMERA_MESSMASS_INTERNAL_SECRET), via assertCameraSecret.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { assertCameraSecret } from '@/lib/cameraClient';
import { applyLinkStats, parseLinkStatTotals } from '@/lib/cameraLinkStats';
import { getDb } from '@/lib/db';
import { error as logError } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ messmassEventId: string }> }
) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  const { messmassEventId } = await context.params;
  if (!ObjectId.isValid(messmassEventId)) {
    return NextResponse.json({ success: false, error: 'invalid_event_id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseLinkStatTotals(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: 'invalid_totals', detail: parsed.error }, { status: 400 });
  }

  try {
    const db = await getDb();
    const found = await applyLinkStats(db.collection('projects'), new ObjectId(messmassEventId), parsed.totals, new Date().toISOString());
    if (!found) {
      return NextResponse.json({ success: false, error: 'event_not_found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, totals: parsed.totals });
  } catch (error) {
    logError('Camera link stats failed', { messmassEventId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'link_stats_failed' }, { status: 500 });
  }
}
