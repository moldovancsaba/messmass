// app/api/drive-folders/route.ts
// WHAT: Admin-facing endpoints for linking Google Drive folders to a messmass
//       event ("project"). messmass never reads Drive itself — it only stores
//       whatever URL an admin pastes (re-validated server-side); fanmass's own
//       service account is the sole reader/access authority.
// AUTH: Admin session, same helper `/api/bitly/links` uses (getAdminUser()).
// ENDPOINTS:
//   GET  ?projectId=  - List Drive folder links for an event
//   POST              - Add a Drive folder link to an event

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { addDriveFolder, listDriveFolders } from '@/lib/driveFolders';
import { error as logError } from '@/lib/logger';

// Same admin-role check used by other admin-scoped routes (e.g.
// app/api/admin/projects/route.ts) — getAdminUser() only proves a valid
// session exists, not that the role is actually admin (UserRole also
// includes 'guest'/'user'/'api').
function isAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }

    const links = await listDriveFolders(projectId);
    return NextResponse.json({ success: true, links });
  } catch (error) {
    const err = error as Error & { status?: number };
    logError('GET /api/drive-folders error', { context: 'drive-folders' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { projectId, folderUrl, label } = body as { projectId?: string; folderUrl?: string; label?: string };

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }
    if (!folderUrl || !String(folderUrl).trim()) {
      return NextResponse.json({ success: false, error: 'folderUrl is required' }, { status: 400 });
    }

    const link = await addDriveFolder({
      eventId: projectId,
      rawInput: folderUrl,
      label,
      addedBy: user.email || user.name || undefined,
    });

    return NextResponse.json({ success: true, link }, { status: 201 });
  } catch (error) {
    const err = error as Error & { status?: number };
    logError('POST /api/drive-folders error', { context: 'drive-folders' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}
