import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { pushEventStats } from '@/lib/fanmassMapping';

// POST /api/integrations/fanmass/events/[eventId]/stats  { stats: { <variableName>: value, ... } }
// Partial-merge push of fanmass analytics values into the event's mapped variables.
// Derived (formula) variables are skipped. Accepts { stats: {...} } or a bare {...} map.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const statsPartial = body && typeof body.stats === 'object' && body.stats ? body.stats : body;
    const result = await pushEventStats(eventId, statsPartial);
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
