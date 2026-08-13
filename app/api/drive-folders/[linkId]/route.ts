// app/api/drive-folders/[linkId]/route.ts
// WHAT: Remove a Drive folder link from an event. Admin session auth, same
//       helper `/api/bitly/links` uses. Hard delete — same UX as Bitly's
//       remove-with-confirm.
// AUTH: Admin session (getAdminUser()).
// ENDPOINT: DELETE ?projectId=

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { removeDriveFolder } from '@/lib/driveFolders';
import { error as logError } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) {
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
