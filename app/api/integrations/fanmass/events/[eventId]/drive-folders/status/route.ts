// app/api/integrations/fanmass/events/[eventId]/drive-folders/status/route.ts
// WHAT: Status write-back for a single linked Drive folder. Mirrors
//       pushEventStats's shape — a targeted update against one folder link,
//       same requireFanmassIntegrationAuth guard, on the same
//       /api/integrations/fanmass/** surface as everything else the plain
//       bearer/x-api-key MessmassClient calls (the /callbacks route uses the SAME
//       requireFanmassIntegrationAuth - there is no separate HMAC-signed
//       callback path).
// AUTH: requireFanmassIntegrationAuth
// BODY: { folderId: string, status: DriveFolderStatus, lastError?: string,
//         imagesDiscovered?: number, imagesAnalyzed?: number }

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { setDriveFolderStatus, type DriveFolderStatus } from '@/lib/driveFolders';

// WHAT: Accepted folder states, widest first for the error message.
// WHY: 'verified' stays accepted so a fanmass build predating the analysis-aware
//     vocabulary keeps working; it is stored as-is and read as "analyzing" until
//     real counts arrive. Rejecting it would break the producer mid-rollout.
const VALID_STATUSES: DriveFolderStatus[] = ['pending', 'analyzing', 'complete', 'empty', 'error', 'verified'];

function optionalCount(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw Object.assign(new Error(`${field} must be a non-negative number.`), {
      status: 400,
      code: 'INVALID_PROGRESS',
    });
  }
  return Math.trunc(value);
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
    const { folderId, status, lastError, imagesDiscovered, imagesAnalyzed } = body as {
      folderId?: string;
      status?: string;
      lastError?: string;
      imagesDiscovered?: unknown;
      imagesAnalyzed?: unknown;
    };

    if (!folderId || typeof folderId !== 'string') {
      throw Object.assign(new Error('folderId is required.'), { status: 400, code: 'FOLDER_ID_REQUIRED' });
    }
    if (!status || !VALID_STATUSES.includes(status as DriveFolderStatus)) {
      throw Object.assign(new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`), {
        status: 400,
        code: 'INVALID_STATUS',
      });
    }

    const link = await setDriveFolderStatus(eventId, folderId, status as DriveFolderStatus, lastError, {
      imagesDiscovered: optionalCount(imagesDiscovered, 'imagesDiscovered'),
      imagesAnalyzed: optionalCount(imagesAnalyzed, 'imagesAnalyzed'),
    });
    return jsonSuccess({ link });
  } catch (err) {
    return handleRouteError(err);
  }
}
