// app/api/admin/sync-partners-to-camera/route.ts
// WHAT: One-click backfill -- pushes EVERY messmass partner that has never
//     been linked to camera (no cameraPartnerId yet) over to camera now,
//     regardless of whether an event has ever been created for them.
// WHY: The only automatic trigger for messmass -> camera partner sync is
//     event creation (see lib/cameraProvision.ts). Partners created before
//     this feature existed, or without any event yet, were never pushed.
//     This is a GET so an already-logged-in admin can just open the URL.
// HOW: Reuses lib/cameraProvision.ts's ensureCameraPartner() -- the exact
//     same link-or-create logic that already runs on event creation.

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { ensureCameraPartner } from '@/lib/cameraProvision';
import { cameraConfigured } from '@/lib/cameraClient';
import { error as logError } from '@/lib/logger';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  if (!cameraConfigured()) {
    return NextResponse.json({ error: 'camera_not_configured' }, { status: 503 });
  }

  const db = await getDb();
  const partners = await db
    .collection('partners')
    .find({ cameraPartnerId: { $exists: false } })
    .toArray();

  let linked = 0;
  let failed = 0;
  const failures: Array<{ id: string; name: string; error: string }> = [];

  for (const partner of partners) {
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

  return NextResponse.json({
    success: true,
    scanned: partners.length,
    linked,
    failed,
    failures: failures.slice(0, 20),
  });
}
