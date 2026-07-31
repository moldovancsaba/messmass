// app/api/admin/sync-events-to-camera/route.ts
// WHAT: One-click backfill -- pushes messmass events (projects) that have
//     never been provisioned into camera (no externalRefs.camera yet) over
//     to camera now. Sibling of /api/admin/sync-partners-to-camera; run that
//     one first so partners/organizations are already linked when events
//     provision (provisionCameraEventForProject requires the partner to
//     already be resolvable in camera).
// WHY: The only automatic trigger for messmass -> camera event sync is
//     THIS event's own creation (see app/api/projects/route.ts). Events
//     created before this integration existed were never pushed.
// HOW: Reuses lib/cameraProvision.ts's provisionCameraEventForProject() --
//     the exact same logic that already runs on event creation.
// RATE LIMIT: same as the partners backfill -- camera's internal-write
//     endpoints allow 60 requests/60s per caller. Processes at most
//     BATCH_SIZE events per call, paced ~1s apart; safe (and expected) to
//     call this same URL again until `remaining` is 0.

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { provisionCameraEventForProject } from '@/lib/cameraProvision';
import { cameraConfigured } from '@/lib/cameraClient';
import { error as logError } from '@/lib/logger';

export const maxDuration = 60;

const BATCH_SIZE = 35;
const PACE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const UNSYNCED_QUERY = {
  'externalRefs.camera': { $exists: false },
  $or: [{ partner1Id: { $exists: true } }, { partnerId: { $exists: true } }],
};

export async function GET() {
  const admin = await getAdminUser();
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  if (!cameraConfigured()) {
    return NextResponse.json({ error: 'camera_not_configured' }, { status: 503 });
  }

  const db = await getDb();
  const totalRemainingBefore = await db.collection('projects').countDocuments(UNSYNCED_QUERY);
  const projects = await db
    .collection('projects')
    .find(UNSYNCED_QUERY)
    .limit(BATCH_SIZE)
    .toArray();

  let provisioned = 0;
  let failed = 0;
  const failures: Array<{ id: string; name: string; error: string }> = [];

  for (let i = 0; i < projects.length; i++) {
    if (i > 0) await sleep(PACE_MS);
    const project = projects[i];
    try {
      const result = await provisionCameraEventForProject(db, project);
      if (result.provisioned) {
        provisioned++;
      } else {
        failed++;
        failures.push({ id: String(project._id), name: String(project.eventName || 'Untitled'), error: result.reason || 'unknown' });
      }
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : String(e);
      failures.push({ id: String(project._id), name: String(project.eventName || 'Untitled'), error: message });
      logError('Event backfill to camera failed', { projectId: String(project._id) }, e instanceof Error ? e : new Error(message));
    }
  }

  const remaining = totalRemainingBefore - provisioned;

  return NextResponse.json({
    success: true,
    processedThisCall: projects.length,
    provisioned,
    failed,
    remaining,
    note: remaining > 0 ? 'Rate-limited to a safe batch size -- open this same URL again to continue.' : 'All events provisioned.',
    failures: failures.slice(0, 20),
  });
}
