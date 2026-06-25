import { NextRequest } from 'next/server';
import {
  getCorrelationId,
  handleRouteError,
  jsonSuccess,
  loadEventContext,
  requireFanmassIntegrationAuth,
} from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;

  try {
    const { eventId } = await params;
    const context = await loadEventContext(eventId, getCorrelationId(request));
    return jsonSuccess(context);
  } catch (err) {
    return handleRouteError(err);
  }
}
