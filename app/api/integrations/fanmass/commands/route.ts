// app/api/integrations/fanmass/commands/route.ts
// WHAT: Every pending operator command, for fanmass's poll.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listPendingCommands } from '@/lib/fanmassCommands';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const commands = await listPendingCommands();
    return jsonSuccess({ commands });
  } catch (err) {
    return handleRouteError(err);
  }
}
