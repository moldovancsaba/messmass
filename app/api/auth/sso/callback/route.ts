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
import crypto from 'crypto';
import {
  createUser,
  findUserByEmail,
  findUserBySsoId,
  getUsersCollection,
  updateUserLastLogin,
  type UserRole,
} from '@/lib/users';
import { generateSessionToken, type SessionTokenData } from '@/lib/sessionTokens';
import {
  decodeIdToken,
  exchangeCodeForToken,
  getOAuthCallbackRedirectUri,
  getUserInfo,
  shouldUseConfidentialOAuth,
} from '@/lib/auth/ssoOAuth';
import { getAppPermission, hasAppAccess, type AppPermission } from '@/lib/auth/ssoPermissions';
import { clearPendingOAuthCookie, readPendingOAuthCookie } from '@/lib/auth/oauthPendingCookie';
import { logAuthSuccess, error as logError } from '@/lib/logger';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import config from '@/lib/config';

const AUTH_SOURCE_COOKIE = 'auth-source';

/** SSO app-role -> messmass's local role set. 'none' is handled separately (access denied). */
function mapSsoRoleToMessmassRole(ssoRole: AppPermission['role']): UserRole {
  if (ssoRole === 'superadmin') return 'superadmin';
  if (ssoRole === 'admin') return 'admin';
  return 'user';
}

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

    // Resolve local user: by linked SSO id first, then by email (first-ever SSO
    // login for an existing local account links it), else auto-provision.
    let user = await findUserBySsoId(ssoUser.id);
    if (!user) {
      user = await findUserByEmail(ssoUser.email);
    }

    const mappedRole = mapSsoRoleToMessmassRole(permission.role);

    if (!user) {
      user = await createUser({
        email: ssoUser.email,
        name: ssoUser.name || ssoUser.email,
        role: mappedRole,
        ssoUserId: ssoUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (user.ssoUserId !== ssoUser.id || user.role !== mappedRole) {
      // Keep the local cache in sync with SSO (source of truth for role).
      const col = await getUsersCollection();
      await col.updateOne(
        { _id: user._id },
        { $set: { ssoUserId: ssoUser.id, role: mappedRole, updatedAt: new Date().toISOString() } }
      );
      user = { ...user, ssoUserId: ssoUser.id, role: mappedRole };
    }

    const tokenData: SessionTokenData = {
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: user._id!.toString(),
      role: user.role,
    };
    const sessionToken = generateSessionToken(tokenData);

    const isProduction = config.nodeEnv === 'production';
    const host = request.headers.get('host') || '';
    const domain = isProduction && host.endsWith('messmass.com') ? '.messmass.com' : undefined;
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/' as const,
      ...(domain && { domain }),
    };

    const userId = user._id!.toString();
    try {
      await updateUserLastLogin(userId);
    } catch {
      // non-fatal
    }
    logAuthSuccess(userId, request.headers.get('x-forwarded-for') || undefined);

    const safeRedirect = pending.redirectTo.startsWith('/admin') ? pending.redirectTo : '/admin';
    const response = NextResponse.redirect(new URL(safeRedirect, request.url));
    clearPendingOAuthCookie(response);
    response.cookies.set('admin-session', sessionToken, cookieOpts);
    response.cookies.set(AUTH_SOURCE_COOKIE, 'sso', { ...cookieOpts, httpOnly: false });
    if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
      response.cookies.set('session-format', 'jwt', { ...cookieOpts, httpOnly: false });
    }

    return response;
  } catch (error) {
    logError('SSO callback failed', {}, error instanceof Error ? error : new Error(String(error)));
    return redirectWithError(request, 'auth_failed');
  }
}
