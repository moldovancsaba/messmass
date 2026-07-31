// app/api/integrations/camera/partners/route.ts
// WHAT: Inbound endpoint receiving partner data pushed FROM camera -- the
//     reverse of camera's own /api/internal/messmass/partners (which receives
//     messmass -> camera pushes). Lets partners created directly in camera's
//     admin UI flow back into messmass instead of only existing on camera's side.
// WHY: Bidirectional partner sync, requested after users noticed camera-native
//     partners never appeared in messmass.
// AUTH: reuses the SAME shared secret already used for the forward direction
//     (CAMERA_MESSMASS_INTERNAL_SECRET / config.cameraProvisionToken) -- both
//     apps already hold this value, no new secret to manage.

import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { upsertPartnerFromCamera } from '@/lib/cameraPartnerSync';
import { error as logError } from '@/lib/logger';

function assertCameraSecret(request: NextRequest): NextResponse | null {
  const configured = config.cameraProvisionToken;
  if (!configured) {
    return NextResponse.json({ success: false, error: 'camera_integration_not_configured' }, { status: 503 });
  }
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerSecret = request.headers.get('x-camera-secret')?.trim() || '';
  if (bearer !== configured && headerSecret !== configured) {
    return NextResponse.json({ success: false, error: 'invalid_camera_secret' }, { status: 401 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 });
  }

  const cameraPartnerId = String(body?.cameraPartnerId || '').trim();
  const name = String(body?.name || '').trim();
  if (!cameraPartnerId || !name) {
    return NextResponse.json({ success: false, error: 'cameraPartnerId and name are required' }, { status: 400 });
  }

  try {
    const partner = await upsertPartnerFromCamera({
      cameraPartnerId,
      name,
      logoUrl: typeof body?.logoUrl === 'string' ? body.logoUrl : undefined,
    });
    return NextResponse.json({ success: true, partner });
  } catch (error) {
    logError('Camera partner sync failed', { cameraPartnerId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'sync_failed' }, { status: 500 });
  }
}
