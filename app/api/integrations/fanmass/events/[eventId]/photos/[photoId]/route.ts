// Receive or tombstone one identity-free Fanmass analysis for one Camera photo.
// Fanmass owns discovery and serial analysis; Messmass stores photo facts and
// derives event report aggregates from this durable per-photo collection.
import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { storeFanmassPhotoAnalysis, tombstoneFanmassPhotoAnalysis } from '@/lib/fanmassPhotoAnalyses';

async function readObject(request: NextRequest): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('A JSON photo-analysis object is required.'), {
      status: 400,
      code: 'INVALID_PHOTO_ANALYSIS',
    });
  }
  return body as Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; photoId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId, photoId } = await params;
    const result = await storeFanmassPhotoAnalysis(eventId, photoId, await readObject(request));
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; photoId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const { eventId, photoId } = await params;
    const result = await tombstoneFanmassPhotoAnalysis(eventId, photoId, await readObject(request));
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
