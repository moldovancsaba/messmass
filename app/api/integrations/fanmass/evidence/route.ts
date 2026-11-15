// Receive proof samples from Fanmass for the global evidence library: the crop of the picture where a brand or club
// name was read, its box and how it was identified, for any project or event (`origin`; none means `szrt`, the
// sender before the library became global). Images go to R2, one document per region is upserted.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { isMediaStorageConfigured } from '@/lib/mediaStorage';
import { parseEvidenceBatch, storeEvidenceBatch, type EvidenceDb } from '@/lib/fanmassEvidence';

export const dynamic = 'force-dynamic';
// A batch uploads up to 40 crops to R2; give it room (the sender also keeps batches small)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    if (!isMediaStorageConfigured()) {
      throw Object.assign(new Error('Media storage is not configured.'), { status: 503, code: 'MEDIA_STORAGE_NOT_CONFIGURED' });
    }
    const body = await request.json().catch(() => null);
    const { parsed, skipped, replaceFiles, origin } = parseEvidenceBatch(body);
    const result = await storeEvidenceBatch((await getDb()) as unknown as EvidenceDb, parsed, { replaceFiles, origin });
    return jsonSuccess({
      origin,
      received: parsed.length + skipped.length,
      stored: result.stored,
      replaced: result.replaced,
      skipped: [...skipped, ...result.skipped].sort((a, b) => a.index - b.index),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
