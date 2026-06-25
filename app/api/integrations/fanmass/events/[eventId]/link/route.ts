import { NextRequest } from 'next/server';
import {
  getCorrelationId,
  handleRouteError,
  jsonSuccess,
  loadFanmassLink,
  requireFanmassIntegrationAuth,
  upsertFanmassLink,
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
    return jsonSuccess({ link });
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
    const body = await request.json().catch(() => ({}));
    const link = await upsertFanmassLink(eventId, String(body.fanmassBatchId || body.batchId || ''), {
      status: body.status,
      contextVersion: body.contextVersion,
      contextHash: body.contextHash,
      correlationId: getCorrelationId(request),
      auditAction: 'link_upserted_from_api',
    });
    return jsonSuccess({ link }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
