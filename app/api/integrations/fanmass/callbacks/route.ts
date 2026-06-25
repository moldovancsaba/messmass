import { NextRequest } from 'next/server';
import {
  getCorrelationId,
  handleRouteError,
  jsonSuccess,
  requireFanmassIntegrationAuth,
  syncFanmassAnalytics,
  upsertFanmassLink,
} from '@/lib/fanmassIntegration';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const eventId = String(body.messmassEventId || '');
    const batchId = String(body.batchId || '');
    const status = String(body.status || 'partial');
    const correlationId = body.correlationId || getCorrelationId(request);

    const link = await upsertFanmassLink(eventId, batchId, {
      status: status === 'ready' ? 'ready' : status === 'failed' ? 'failed' : 'partial',
      contextVersion: body.contractVersion,
      correlationId,
      auditAction: 'fanmass_callback_received',
    });

    let sync = null;
    if (status === 'ready' || status === 'partial') {
      sync = await syncFanmassAnalytics(eventId, correlationId, { force: true });
    }

    return jsonSuccess({ accepted: true, link, sync });
  } catch (err) {
    return handleRouteError(err);
  }
}
