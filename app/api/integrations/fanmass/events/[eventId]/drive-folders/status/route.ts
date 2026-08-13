// app/api/integrations/fanmass/events/[eventId]/drive-folders/status/route.ts
// WHAT: Status write-back for a single linked Drive folder. Mirrors
//       pushEventStats's shape — a targeted update against one folder link,
//       same requireFanmassIntegrationAuth guard, on the same
//       /api/integrations/fanmass/** surface as everything else the plain
//       bearer/x-api-key MessmassClient calls (not the separate HMAC-signed
//       callback path).
// AUTH: requireFanmassIntegrationAuth
// BODY: { folderId: string, status: 'pending' | 'verified' | 'error', lastError?: string }

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { setDriveFolderStatus, type DriveFolderStatus } from '@/lib/driveFolders';

const VALID_STATUSES: DriveFolderStatus[] = ['pending', 'verified', 'error'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const { folderId, status, lastError } = body as { folderId?: string; status?: string; lastError?: string };

    if (!folderId || typeof folderId !== 'string') {
      throw Object.assign(new Error('folderId is required.'), { status: 400, code: 'FOLDER_ID_REQUIRED' });
    }
    if (!status || !VALID_STATUSES.includes(status as DriveFolderStatus)) {
      throw Object.assign(new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`), {
        status: 400,
        code: 'INVALID_STATUS',
      });
    }

    const link = await setDriveFolderStatus(eventId, folderId, status as DriveFolderStatus, lastError);
    return jsonSuccess({ link });
  } catch (err) {
    return handleRouteError(err);
  }
}
