import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listPartnerEvents } from '@/lib/fanmassMapping';

// GET /api/integrations/fanmass/partners/[partnerId]/events — list a messmass partner's events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { partnerId } = await params;
    const events = await listPartnerEvents(partnerId);
    return jsonSuccess({ partnerId, events });
  } catch (err) {
    return handleRouteError(err);
  }
}
