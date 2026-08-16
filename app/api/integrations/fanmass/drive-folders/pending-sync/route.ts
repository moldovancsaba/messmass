// app/api/integrations/fanmass/drive-folders/pending-sync/route.ts
// WHAT: Cheap poll target for "check now" — folder ids with a live sync
//       request, nothing else. Deliberately separate from GET
//       /api/integrations/fanmass/drive-folders, which joins events and
//       partners for the full sweep and is too heavy to call every worker
//       loop tick.
// AUTH: requireFanmassIntegrationAuth (same bearer/x-api-key token as the
//       rest of the /api/integrations/fanmass/** surface).

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listPendingSyncFolderIds } from '@/lib/driveFolders';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const folderIds = await listPendingSyncFolderIds();
    return jsonSuccess({ folderIds });
  } catch (err) {
    return handleRouteError(err);
  }
}
