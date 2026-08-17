// app/api/admin/fanmass/events/route.ts
// WHAT: Every messmass event with at least one Fanmass dashboard snapshot on
//     record, newest-first — the source list for the /admin/fanmass event
//     picker.
// AUTH: admin session, same requireAdmin() posture as the fanmass link
//     status route this sits beside.

import { jsonError, jsonSuccess, handleRouteError } from '@/lib/fanmassIntegration';
import { listSnapshotEvents } from '@/lib/fanmassDashboardSnapshot';
import { getAdminUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return jsonError(401, 'ADMIN_AUTH_REQUIRED', 'Admin authentication is required.');
  }
  try {
    const events = await listSnapshotEvents();
    return jsonSuccess({ events });
  } catch (err) {
    return handleRouteError(err);
  }
}
