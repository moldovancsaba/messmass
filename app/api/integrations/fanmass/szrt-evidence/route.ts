// Receive proof samples for SZRT brand and club figures from Fanmass: the crop of the picture where the name
// was read, its box and how it was identified. Images go to R2, one document per region is upserted.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { isMediaStorageConfigured } from '@/lib/mediaStorage';
import { parseEvidenceBatch, storeEvidenceBatch, type EvidenceDb } from '@/lib/szrtBrandEvidence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    if (!isMediaStorageConfigured()) {
      throw Object.assign(new Error('Media storage is not configured.'), { status: 503, code: 'MEDIA_STORAGE_NOT_CONFIGURED' });
    }
    const body = await request.json().catch(() => null);
    const { parsed, skipped } = parseEvidenceBatch(body);
    const result = await storeEvidenceBatch((await getDb()) as unknown as EvidenceDb, parsed);
    return jsonSuccess({
      received: parsed.length + skipped.length,
      stored: result.stored,
      skipped: [...skipped, ...result.skipped].sort((a, b) => a.index - b.index),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
