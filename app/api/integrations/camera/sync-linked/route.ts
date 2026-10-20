import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { syncLinkedEvents } from '@/lib/cameraProvision';

export const maxDuration = 60;

// POST /api/integrations/camera/sync-linked?limit=20&offset=0
// Refresh a bounded page of existing Camera mirrors from Messmass source data.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = Number.parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);
    return jsonSuccess(await syncLinkedEvents(
      await getDb(),
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 20,
      Number.isFinite(offset) && offset > 0 ? offset : 0,
    ));
  } catch (err) {
    return handleRouteError(err);
  }
}
