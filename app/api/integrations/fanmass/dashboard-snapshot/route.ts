// app/api/integrations/fanmass/dashboard-snapshot/route.ts
// WHAT: Receive a dashboard snapshot (Executive/Analytics/Run Control/Entity
//     Curation) pushed by fanmass on its own cadence.
// WHY: The four new /admin/fanmass tabs read this collection directly —
//     server-side, no live call back to fanmass — so fanmass stays the only
//     outbound caller in this integration, exactly as every other channel
//     under this route tree already does (fanmass has no public URL).
// AUTH: requireFanmassIntegrationAuth, same token as every other push.

import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { storeDashboardSnapshot } from '@/lib/fanmassDashboardSnapshot';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('A JSON snapshot body is required.'), {
        status: 400,
        code: 'INVALID_SNAPSHOT',
      });
    }
    const result = await storeDashboardSnapshot(body);
    return jsonSuccess(result, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
