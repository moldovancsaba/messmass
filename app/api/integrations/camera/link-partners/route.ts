import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { linkExistingPartners } from '@/lib/cameraProvision';

// POST /api/integrations/camera/link-partners
// Ops: link messmass partners to existing camera partners by name (no creation).
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const db = await getDb();
    return jsonSuccess(await linkExistingPartners(db));
  } catch (err) {
    return handleRouteError(err);
  }
}
