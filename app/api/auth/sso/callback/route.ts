// app/api/auth/sso/callback/route.ts
// WHAT: OAuth2/OIDC callback for messmass's registered SSO client. Exchanges the
//     authorization code, reads messmass's role from SSO's central per-app
//     permission store, and auto-provisions/updates the local user record —
//     no more "no_account" rejection for users who haven't been manually
//     pre-created by an admin.
// WHY: #46 + SSO_EMAIL_UNIFICATION_PLAN.md Phase 1. Session representation
//     (admin-session cookie, JWT/legacy format, cookie domain) is UNCHANGED
//     from the previous token-validate flow, so nothing downstream (middleware,
//     isAdmin checks, /admin/dashboard gating) needs to change.

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeIdToken,
  exchangeCodeForToken,
  getOAuthCallbackRedirectUri,
  getUserInfo,
  shouldUseConfidentialOAuth,
} from '@/lib/auth/ssoOAuth';
import { getAppPermission, hasAppAccess, type AppPermission } from '@/lib/auth/ssoPermissions';
import { mintMessmassSessionForSsoUser } from '@/lib/auth/mintSession';
import { clearPendingOAuthCookie, readPendingOAuthCookie } from '@/lib/auth/oauthPendingCookie';
import { pushSsoSessionToCamera } from '@/lib/cameraClient';
import { error as logError } from '@/lib/logger';
import config from '@/lib/config';

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url));
  clearPendingOAuthCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    if (!config.ssoBaseUrl?.trim() || !config.ssoClientId?.trim()) {
      return redirectWithError(request, 'sso_not_configured');
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      logError('SSO OAuth error', { error: oauthError }, new Error(oauthError));
      return redirectWithError(request, 'sso_oauth_error');
    }
    if (!code || !state) {
      return redirectWithError(request, 'missing_code');
    }

    const pending = readPendingOAuthCookie(request);
    if (!pending || pending.state !== state) {
      return redirectWithError(request, 'session_expired');
    }

    const confidential = shouldUseConfidentialOAuth();
    const redirectUri = getOAuthCallbackRedirectUri(request);

    if (!confidential && !pending.codeVerifier) {
      return redirectWithError(request, 'session_expired');
    }

    const tokens = await exchangeCodeForToken(code, redirectUri, confidential ? undefined : pending.codeVerifier);

    let ssoUser = decodeIdToken(tokens.id_token);
    const badEmail = !ssoUser.email || ssoUser.email === 'sso@doneisbetter.com' || ssoUser.email === 'unknown@unknown.com';
    if (badEmail) {
      try {
        const info = await getUserInfo(tokens.access_token);
        if (info.email && info.email !== 'sso@doneisbetter.com') {
          ssoUser = { ...ssoUser, id: info.id || ssoUser.id, email: info.email, name: info.name ?? ssoUser.name };
        }
      } catch (e) {
        logError('SSO userinfo enrichment failed', {}, e instanceof Error ? e : new Error(String(e)));
      }
    }

    let permission: AppPermission;
    try {
      permission = await getAppPermission(ssoUser.id, tokens.access_token);
    } catch (e) {
      logError('Failed to get messmass app permission from SSO', { ssoUserId: ssoUser.id }, e instanceof Error ? e : new Error(String(e)));
      return redirectWithError(request, 'permission_check_failed');
    }

    if (!hasAppAccess(permission)) {
      logError('SSO login denied: no messmass access', { ssoUserId: ssoUser.id, email: ssoUser.email, status: permission.status });
      return redirectWithError(request, 'no_access');
    }

    const safeRedirect = pending.redirectTo.startsWith('/admin') ? pending.redirectTo : '/admin';
    const response = NextResponse.redirect(new URL(safeRedirect, request.url));
    clearPendingOAuthCookie(response);

    const minted = await mintMessmassSessionForSsoUser(ssoUser, permission, request, response);
    if (!minted) {
      // hasAppAccess() already checked above; this is defense-in-depth only.
      return redirectWithError(request, 'no_access');
    }

    // WHAT: Best-effort -- also log this user into camera, so one SSO login
    //     covers both apps (see SESSION_COOKIE_DOMAIN=.messmass.com on
    //     camera's side + lib/cameraClient.ts:pushSsoSessionToCamera).
    // WHY: Never let this block or fail messmass's own login -- camera being
    //     unreachable, or this user simply not having camera access, are
    //     both fine outcomes; the user just won't be auto-logged into camera.
    try {
      const cameraCookies = await pushSsoSessionToCamera(tokens);
      for (const cookie of cameraCookies || []) {
        response.headers.append('set-cookie', cookie);
      }
    } catch (e) {
      logError('Cross-app camera session push failed (non-fatal)', {}, e instanceof Error ? e : new Error(String(e)));
    }

    return response;
  } catch (error) {
    logError('SSO callback failed', {}, error instanceof Error ? error : new Error(String(error)));
    return redirectWithError(request, 'auth_failed');
  }
}
