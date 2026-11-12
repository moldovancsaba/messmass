// Receive the SZRT report's audience, brand and club figures from the Fanmass deep rerun. Fanmass sends the
// whole picture each time; Messmass replaces the stored figures and never changes `publishApproved`.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { parseSzrtProgress, storeSzrtProgress, type ProgressDb } from '@/lib/szrtVisionProgress';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const doc = parseSzrtProgress(await request.json().catch(() => null));
    await storeSzrtProgress((await getDb()) as unknown as ProgressDb, doc);
    return jsonSuccess({ processedCount: doc.processedCount, totalImages: doc.totalImages, status: doc.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
