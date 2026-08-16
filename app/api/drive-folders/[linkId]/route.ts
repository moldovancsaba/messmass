// app/api/drive-folders/[linkId]/route.ts
// WHAT: Remove, pause/resume, or request an immediate check for a Drive folder
//       link. Admin session auth, same helper `/api/bitly/links` uses.
// AUTH: Admin session (getAdminUser()).
// ENDPOINTS:
//   DELETE ?projectId=                        - Remove the link. Hard delete.
//   PATCH  ?projectId=  { action }             - action: 'pause' | 'resume' | 'sync'

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { removeDriveFolder, requestDriveFolderSync, setDriveFolderPaused } from '@/lib/driveFolders';
import { error as logError } from '@/lib/logger';

// Same admin-role check used by other admin-scoped routes (e.g.
// app/api/admin/projects/route.ts) — getAdminUser() only proves a valid
// session exists, not that the role is actually admin (UserRole also
// includes 'guest'/'user'/'api').
function isAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }

    await removeDriveFolder(projectId, linkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error & { status?: number };
    logError('DELETE /api/drive-folders/[linkId] error', { context: 'drive-folders' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    let link;
    if (action === 'pause') {
      link = await setDriveFolderPaused(projectId, linkId, true);
    } else if (action === 'resume') {
      link = await setDriveFolderPaused(projectId, linkId, false);
    } else if (action === 'sync') {
      link = await requestDriveFolderSync(projectId, linkId);
    } else {
      return NextResponse.json(
        { success: false, error: "action must be one of: 'pause', 'resume', 'sync'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, link });
  } catch (error) {
    const err = error as Error & { status?: number };
    logError('PATCH /api/drive-folders/[linkId] error', { context: 'drive-folders' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}
