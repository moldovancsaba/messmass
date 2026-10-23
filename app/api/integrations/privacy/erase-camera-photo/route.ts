import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { tombstoneFanmassPhotoAnalysisForErasure } from '@/lib/fanmassPhotoAnalyses';
import { requireMessmassPrivacyErasureSecret } from '@/lib/privacy/messmassErasureAuth';

export const runtime = 'nodejs';

/**
 * SSO may erase only the exact Camera photo it resolved for an approved case.
 * Tombstoning is idempotent and immediately rebuilds Messmass event totals.
 */
export async function DELETE(request: NextRequest) {
  const authError = requireMessmassPrivacyErasureSecret(request, config.privacyErasureSecret);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const input = body as Record<string, unknown>;
  const allowed = new Set(['request_id', 'messmass_event_id', 'camera_partner_id', 'camera_event_id', 'camera_photo_id']);
  if (Object.keys(input).some((key) => !allowed.has(key)) ||
      Object.keys(input).length !== allowed.size ||
      Object.values(input).some((value) => typeof value !== 'string' || value.length === 0 || value.trim() !== value)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const result = await tombstoneFanmassPhotoAnalysisForErasure({
      requestId: input.request_id as string,
      messmassEventId: input.messmass_event_id as string,
      cameraPartnerId: input.camera_partner_id as string,
      cameraEventId: input.camera_event_id as string,
      cameraPhotoId: input.camera_photo_id as string,
    });
    return NextResponse.json({ status: 'deleted', received_at: result.receivedAt }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const status = Number.isInteger((error as { status?: number })?.status)
      ? (error as { status: number }).status
      : 500;
    const code = typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code: string }).code
      : 'internal_error';
    return NextResponse.json({ error: code }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
