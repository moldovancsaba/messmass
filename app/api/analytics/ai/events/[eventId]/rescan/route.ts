// app/api/analytics/ai/events/[eventId]/rescan/route.ts
// WHAT: Operator-requested re-analysis for one event.
// AUTH: GET — any signed-in user, same posture as the summary route this
//       pairs with. POST — admin session, same isAdmin() check as
//       /api/drive-folders: this queues real (re-)analysis work on fanmass,
//       unlike a read.
// ENDPOINTS:
//   GET   - The pending rescan request for this event, if any
//   POST  { moduleId: 'demographics' | 'brands' | 'poster_faces' | 'all' }
//         - Request a rescan

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, type AdminUser } from '@/lib/auth';
import { getRescanRequest, requestRescan, RESCAN_MODULE_OPTIONS, type RescanModuleId } from '@/lib/aiRescan';
import { error as logError } from '@/lib/logger';

function isAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

const VALID_MODULE_IDS: Array<RescanModuleId | 'all'> = ['all', ...RESCAN_MODULE_OPTIONS.map((o) => o.id)];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }
    const { eventId } = await params;
    const request = await getRescanRequest(eventId);
    return NextResponse.json({ success: true, data: request });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    logError('GET /api/analytics/ai/events/[eventId]/rescan error', { context: 'ai-rescan' }, err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { success: false, error: { message: (err as Error).message || 'Could not load rescan status.' } },
      { status }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const { moduleId } = body as { moduleId?: string };
    if (!moduleId || !VALID_MODULE_IDS.includes(moduleId as RescanModuleId | 'all')) {
      return NextResponse.json(
        { success: false, error: { message: `moduleId must be one of: ${VALID_MODULE_IDS.join(', ')}` } },
        { status: 400 }
      );
    }
    const result = await requestRescan(eventId, moduleId as RescanModuleId | 'all', user.email || user.name || undefined);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    logError('POST /api/analytics/ai/events/[eventId]/rescan error', { context: 'ai-rescan' }, err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { success: false, error: { message: (err as Error).message || 'Could not request a rescan.' } },
      { status }
    );
  }
}
