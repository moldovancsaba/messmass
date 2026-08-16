// app/api/integrations/fanmass/rescan-requests/route.ts
// WHAT: Every pending operator-requested rescan, for fanmass's poll.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listPendingRescanRequests } from '@/lib/aiRescan';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const requests = await listPendingRescanRequests();
    return jsonSuccess({ requests });
  } catch (err) {
    return handleRouteError(err);
  }
}
