// WHAT: Returns the current Messmass-owned partner style for Camera's partner workspace.
// WHY: Camera can show the same source palette as Messmass without copying style data into Camera.
// AUTH: The shared Camera integration secret; never expose this route to browser clients.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { assertCameraSecret } from '@/lib/cameraClient';
import { buildCameraPartnerStyleContext } from '@/lib/cameraFrameContext';
import { getDb } from '@/lib/db';
import { error as logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ messmassPartnerId: string }> },
) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  const { messmassPartnerId } = await context.params;
  if (!ObjectId.isValid(messmassPartnerId)) {
    return NextResponse.json({ success: false, error: 'invalid_partner_id' }, { status: 400 });
  }

  try {
    const partnerContext = await buildCameraPartnerStyleContext(await getDb(), messmassPartnerId);
    if (!partnerContext) {
      return NextResponse.json({ success: false, error: 'partner_not_found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...partnerContext });
  } catch (error) {
    logError('Camera partner style context failed', { messmassPartnerId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'partner_style_context_failed' }, { status: 500 });
  }
}
