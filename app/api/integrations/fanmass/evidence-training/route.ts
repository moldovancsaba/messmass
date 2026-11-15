// What the people's decisions teach the whole Fanmass system, for every project and event: texts that are not a
// name (`deny`) and texts that are one (`alias`). Fanmass applies them to every later analysis and re-judges
// results already made with them (services/evidence_learning.py).
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { listTrainingRules, type ReviewDb } from '@/lib/fanmassEvidenceReview';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    return jsonSuccess(await listTrainingRules((await getDb()) as unknown as ReviewDb));
  } catch (err) {
    return handleRouteError(err);
  }
}
