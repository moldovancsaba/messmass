// app/api/integrations/fanmass/events/[eventId]/analysis-summary/route.ts
// WHAT: Receive the full per-event analysis summary from fanmass.
// WHY: The stats push carries only flat scalars; the structured analysis — brand
//     and club mentions, demographics — was discarded at the boundary. This is the
//     channel that brings the whole contract document across, beside the stats
//     push and failure-isolated from it.
// AUTH: requireFanmassIntegrationAuth, same token as the stats push.

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { storeAnalysisSummary } from '@/lib/aiAnalysisSummary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId } = await params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('A JSON summary body is required.'), {
        status: 400,
        code: 'INVALID_SUMMARY',
      });
    }
    const result = await storeAnalysisSummary(eventId, body);
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
