// app/api/admin/fanmass/snapshot/route.ts
// WHAT: The latest Fanmass dashboard snapshot for one messmass event —
//     ?eventId=<id> — the data source for the /admin/fanmass tabs (Executive,
//     Analytics, Run Control read side, Entity Curation read side).
// WHY: The admin tabs read messmass's own DB directly, never calling out to
//     Fanmass live — Fanmass is always the outbound caller (see
//     lib/fanmassDashboardSnapshot.ts's module header).
// AUTH: admin session, same requireAdmin() posture as the fanmass link
//     status route this sits beside.

import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess, handleRouteError } from '@/lib/fanmassIntegration';
import { getLatestDashboardSnapshot } from '@/lib/fanmassDashboardSnapshot';
import { getAdminUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }
  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return jsonError(401, 'ADMIN_AUTH_REQUIRED', 'Admin authentication is required.');
  }
  try {
    const eventId = request.nextUrl.searchParams.get('eventId')?.trim();
    if (!eventId) {
      throw Object.assign(new Error('eventId query parameter is required.'), { status: 400, code: 'EVENT_ID_REQUIRED' });
    }
    const snapshot = await getLatestDashboardSnapshot(eventId);
    return jsonSuccess({ snapshot });
  } catch (err) {
    return handleRouteError(err);
  }
}
