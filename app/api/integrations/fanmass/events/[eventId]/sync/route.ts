import { NextRequest } from 'next/server';
import {
  getCorrelationId,
  handleRouteError,
  jsonSuccess,
  loadFanmassLink,
  requireFanmassIntegrationAuth,
  syncFanmassAnalytics,
} from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;

  try {
    const { eventId } = await params;
    const link = await loadFanmassLink(eventId);
    return jsonSuccess({ link, lastSyncSnapshot: link?.lastSyncSnapshot || null });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;

  try {
    const { eventId } = await params;
    const url = new URL(request.url);
    const result = await syncFanmassAnalytics(eventId, getCorrelationId(request), {
      dryRun: url.searchParams.get('dryRun') === 'true',
      force: url.searchParams.get('force') === 'true',
    });
    return jsonSuccess(result, result.summary?.status === 'ready' ? 200 : 202);
  } catch (err) {
    return handleRouteError(err);
  }
}
