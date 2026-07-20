import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { provisionMissingEvents } from '@/lib/cameraProvision';

// POST /api/integrations/camera/provision-missing?limit=100
// Ops backfill: provision camera events for existing messmass events that have a
// partner but no camera link yet.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const db = await getDb();
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    return jsonSuccess(await provisionMissingEvents(db, Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 100));
  } catch (err) {
    return handleRouteError(err);
  }
}
