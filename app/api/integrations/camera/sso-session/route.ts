// app/api/integrations/camera/sso-session/route.ts
// WHAT: Mints a real messmass login session for a user who just logged into
//     camera via SSO -- the reverse-direction sibling of camera's
//     /api/internal/messmass/sso-session. Together these give a user who
//     logs into EITHER app a session cookie for BOTH, without a second
//     OAuth round-trip.
// WHY: messmass and camera use completely different session formats
//     (admin-session JWT vs camera_session) with no shared secret between
//     them -- there's no way to "translate" one into the other without
//     minting a real session through each app's own code.
// PATH: lives under /api/integrations/ (not /api/internal/) so it's exempt
//     from messmass's cookie-based CSRF middleware (lib/csrf.ts) -- this is
//     a cookieless server-to-server call authed by a shared secret, not a
//     browser session, so double-submit-cookie CSRF protection doesn't apply
//     (and would just 403 every legitimate call). Same reasoning as the
//     existing /api/integrations/camera/partners and
//     /api/integrations/fanmass/* endpoints.
// SECURITY: assertCameraSecret() only proves "this call came from our
//     camera deployment" -- it does NOT by itself authorize minting a
//     session for an arbitrary user id. This endpoint independently
//     verifies the forwarded access token directly against SSO itself
//     (getUserInfo + getAppPermission, using MESSMASS's own SSO_CLIENT_ID,
//     exactly like the real OAuth callback does) -- never trusting a user
//     id/role asserted by the caller.

import { NextRequest, NextResponse } from 'next/server';
import { assertCameraSecret } from '@/lib/cameraClient';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getUserInfo } from '@/lib/auth/ssoOAuth';
import { getAppPermission, hasAppAccess } from '@/lib/auth/ssoPermissions';
import { mintMessmassSessionForSsoUser } from '@/lib/auth/mintSession';
import { error as logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const authError = assertCameraSecret(request);
  if (authError) return authError;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rl = checkRateLimit(`camera-sso-session:${identifier}`, RATE_LIMITS.WRITE);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: RATE_LIMITS.WRITE.message }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 });
  }

  const accessToken = String(body?.accessToken || '').trim();
  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'accessToken is required' }, { status: 400 });
  }

  let ssoUser;
  try {
    ssoUser = await getUserInfo(accessToken);
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 401 });
  }
  if (!ssoUser.id) {
    return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 401 });
  }

  let permission;
  try {
    permission = await getAppPermission(ssoUser.id, accessToken);
  } catch (e) {
    logError('Failed to get messmass app permission for cross-app session', { ssoUserId: ssoUser.id }, e instanceof Error ? e : new Error(String(e)));
    return NextResponse.json({ success: false, error: 'permission_check_failed' }, { status: 502 });
  }

  if (!hasAppAccess(permission)) {
    return NextResponse.json({ success: false, error: 'no_access' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, role: permission.role });
  const minted = await mintMessmassSessionForSsoUser(ssoUser, permission, request, response, {
    access_token: accessToken,
  });
  if (!minted) {
    return NextResponse.json({ success: false, error: 'no_access' }, { status: 403 });
  }
  return response;
}
