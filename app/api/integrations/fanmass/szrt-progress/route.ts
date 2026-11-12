// Receive the SZRT report's audience, brand and club figures from the Fanmass deep rerun. Fanmass sends the
// whole picture each time; Messmass replaces the stored figures and never changes `publishApproved`.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { dropCachedSzrtReports } from '@/lib/szrtPublication';
import { parseSzrtProgress, storeSzrtProgress, type ProgressDb } from '@/lib/szrtVisionProgress';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const doc = parseSzrtProgress(await request.json().catch(() => null));
    await storeSzrtProgress((await getDb()) as unknown as ProgressDb, doc);
    // The cached report keeps the brand and club lists of the day it was built: drop it so new figures show now
    await dropCachedSzrtReports();
    return jsonSuccess({ processedCount: doc.processedCount, totalImages: doc.totalImages, status: doc.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
