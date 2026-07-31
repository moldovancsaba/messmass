// app/api/admin/sync-partners-to-camera/route.ts
// WHAT: One-click backfill -- pushes messmass partners that have never been
//     linked to camera (no cameraPartnerId yet) over to camera now,
//     regardless of whether an event has ever been created for them.
// WHY: The only automatic trigger for messmass -> camera partner sync is
//     event creation (see lib/cameraProvision.ts). Partners created before
//     this feature existed, or without any event yet, were never pushed.
//     This is a GET so an already-logged-in admin can just open the URL.
// HOW: Reuses lib/cameraProvision.ts's ensureCameraPartner() -- the exact
//     same link-or-create logic that already runs on event creation.
// RATE LIMIT: camera's internal-write endpoints allow 60 requests/60s per
//     caller (see camera's lib/api/rateLimiter.ts INTERNAL_WRITE). Processes
//     at most BATCH_SIZE partners per call, paced ~1.1s apart, to stay under
//     that limit -- safe to just call this endpoint again (idempotent,
//     already-linked partners are skipped) until `remaining` is 0.

import { NextResponse, type NextRequest } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { ensureCameraPartner } from '@/lib/cameraProvision';
import { cameraConfigured } from '@/lib/cameraClient';
import { error as logError } from '@/lib/logger';

export const maxDuration = 60;

const BATCH_SIZE = 35;
const PACE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  if (!cameraConfigured()) {
    return NextResponse.json({ error: 'camera_not_configured' }, { status: 503 });
  }

  const db = await getDb();
  const totalRemainingBefore = await db.collection('partners').countDocuments({ cameraPartnerId: { $exists: false } });
  const partners = await db
    .collection('partners')
    .find({ cameraPartnerId: { $exists: false } })
    .limit(BATCH_SIZE)
    .toArray();

  let linked = 0;
  let failed = 0;
  const failures: Array<{ id: string; name: string; error: string }> = [];

  for (let i = 0; i < partners.length; i++) {
    if (i > 0) await sleep(PACE_MS);
    const partner = partners[i];
    try {
      const cameraPartnerId = await ensureCameraPartner(db, partner._id);
      if (cameraPartnerId) {
        linked++;
      } else {
        failed++;
        failures.push({ id: String(partner._id), name: partner.name, error: 'not_found_after_ensure' });
      }
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : String(e);
      failures.push({ id: String(partner._id), name: partner.name, error: message });
      logError('Partner backfill to camera failed', { partnerId: String(partner._id) }, e instanceof Error ? e : new Error(message));
    }
  }

  const remaining = totalRemainingBefore - linked;

  return NextResponse.json({
    success: true,
    processedThisCall: partners.length,
    linked,
    failed,
    remaining,
    note: remaining > 0 ? 'Rate-limited to a safe batch size -- open this same URL again to continue.' : 'All partners linked.',
    failures: failures.slice(0, 20),
  });
}
