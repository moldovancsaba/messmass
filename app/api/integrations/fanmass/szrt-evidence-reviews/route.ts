// The decisions people made on SZRT proof samples, for Fanmass to apply when it counts the report figures:
// a rejected region is not counted, a corrected one is counted under its corrected name and kind, and a sample a
// person added is counted once for its picture.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listReviewOverrides, type ReviewDb } from '@/lib/szrtEvidenceReview';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    return jsonSuccess({ overrides: await listReviewOverrides((await getDb()) as unknown as ReviewDb) });
  } catch (err) {
    return handleRouteError(err);
  }
}
