import { NextRequest } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import {
  getCorrelationId,
  handleRouteError,
  jsonError,
  jsonSuccess,
  loadFanmassLink,
  syncFanmassAnalytics,
  upsertFanmassLink,
} from '@/lib/fanmassIntegration';

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return jsonError(401, 'ADMIN_AUTH_REQUIRED', 'Admin authentication is required.');
  }

  try {
    const { eventId } = await params;
    const link = await loadFanmassLink(eventId);
    return jsonSuccess({ link });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return jsonError(401, 'ADMIN_AUTH_REQUIRED', 'Admin authentication is required.');
  }

  try {
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const correlationId = getCorrelationId(request);
    const fanmassBatchId = String(body.fanmassBatchId || body.batchId || '').trim();
    let link = await loadFanmassLink(eventId);

    if (fanmassBatchId) {
      link = await upsertFanmassLink(eventId, fanmassBatchId, {
        status: body.status || 'linked',
        contextVersion: body.contextVersion,
        contextHash: body.contextHash,
        correlationId,
        auditAction: 'link_upserted_from_admin',
      });
    }

    if (body.action === 'dry-run' || body.action === 'sync') {
      const sync = await syncFanmassAnalytics(eventId, correlationId, {
        dryRun: body.action === 'dry-run',
        force: body.force === true,
      });
      return jsonSuccess({ link, sync }, sync.summary?.status === 'ready' ? 200 : 202);
    }

    return jsonSuccess({ link }, fanmassBatchId ? 201 : 200);
  } catch (err) {
    return handleRouteError(err);
  }
}
