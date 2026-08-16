// app/api/integrations/fanmass/rescan-requests/[eventId]/route.ts
// WHAT: Acknowledge a rescan request — called once fanmass has actually
//       queued the analysis run, not on receipt, so a crash in between leaves
//       the request for the next poll to retry rather than losing it.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { clearRescanRequest } from '@/lib/aiRescan';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId } = await params;
    await clearRescanRequest(eventId);
    return jsonSuccess({ cleared: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
