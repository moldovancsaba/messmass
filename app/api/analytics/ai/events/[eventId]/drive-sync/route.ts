// app/api/analytics/ai/events/[eventId]/drive-sync/route.ts
// WHAT: Check now / Pause / Resume for every Drive folder linked to an event,
//       from the AI Analytics coverage list — one row per event, not per
//       folder. Mirrors PATCH /api/drive-folders/[linkId], event-scoped.
// AUTH: Admin session, same isAdmin() check as /api/drive-folders.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { requestDriveFolderSyncForEvent, setDriveFolderPausedForEvent } from '@/lib/driveFolders';
import { error as logError } from '@/lib/logger';

function isAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    let updated: number;
    if (action === 'sync') {
      updated = await requestDriveFolderSyncForEvent(eventId);
    } else if (action === 'pause') {
      updated = await setDriveFolderPausedForEvent(eventId, true);
    } else if (action === 'resume') {
      updated = await setDriveFolderPausedForEvent(eventId, false);
    } else {
      return NextResponse.json(
        { success: false, error: "action must be one of: 'sync', 'pause', 'resume'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    const err = error as Error & { status?: number };
    logError('POST /api/analytics/ai/events/[eventId]/drive-sync error', { context: 'ai-drive-sync' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}
