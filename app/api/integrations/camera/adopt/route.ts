import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { adoptCameraPartnersAndEvents } from '@/lib/cameraProvision';

// POST /api/integrations/camera/adopt?dryRun=1&limit=500
// Reverse backfill: adopt existing camera partners + events UP into messmass
// (create org + partner + event where missing, stamp shared identity both ways).
// dryRun previews what would be created without writing.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const sp = request.nextUrl.searchParams;
    const dryRun = sp.get('dryRun') === '1' || sp.get('dryRun') === 'true';
    const limitRaw = Number.parseInt(sp.get('limit') || '', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 1000) : undefined;
    const db = await getDb();
    return jsonSuccess(await adoptCameraPartnersAndEvents(db, { dryRun, limit }));
  } catch (err) {
    return handleRouteError(err);
  }
}
