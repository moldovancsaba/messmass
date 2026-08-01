// lib/auth/mintSession.ts
// WHAT: Resolves/auto-provisions the local messmass user for an
//     already-verified SSO identity + permission, mints a session token,
//     and sets the admin-session (+ auth-source) cookies on `response`.
// WHY: Shared by the browser-facing OAuth callback
//     (app/api/auth/sso/callback) and the internal cross-app endpoint
//     (app/api/internal/camera/sso-session) -- same login outcome either
//     way, whichever app the user actually authenticated against. Extracted
//     from the callback route (was previously inline there) so both call
//     sites stay in sync automatically.

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
import { hasAppAccess, type AppPermission } from '@/lib/auth/ssoPermissions';
import { logAuthSuccess } from '@/lib/logger';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import config from '@/lib/config';

const AUTH_SOURCE_COOKIE = 'auth-source';
const SSO_TOKENS_COOKIE = 'sso-tokens';

/** SSO app-role -> messmass's local role set. 'none' is handled via hasAppAccess() below. */
function mapSsoRoleToMessmassRole(ssoRole: AppPermission['role']): UserRole {
  if (ssoRole === 'superadmin') return 'superadmin';
  if (ssoRole === 'admin') return 'admin';
  return 'user';
}

export interface MintableSsoUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Returns null (and sets no cookies) if `permission` doesn't grant messmass
 * access -- caller decides how to handle that (redirect with an error, or
 * for the cross-app endpoint, a 403 JSON response).
 */
export interface MintableSsoTokens {
  access_token: string;
  refresh_token?: string;
}

export async function mintMessmassSessionForSsoUser(
  ssoUser: MintableSsoUser,
  permission: AppPermission,
  request: NextRequest,
  response: NextResponse,
  ssoTokens?: MintableSsoTokens
): Promise<{ userId: string; role: UserRole } | null> {
  if (!hasAppAccess(permission)) return null;

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

  response.cookies.set('admin-session', sessionToken, cookieOpts);
  response.cookies.set(AUTH_SOURCE_COOKIE, 'sso', { ...cookieOpts, httpOnly: false });
  if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
    response.cookies.set('session-format', 'jwt', { ...cookieOpts, httpOnly: false });
  }
  // WHAT: Keep the SSO access/refresh tokens around (httpOnly, never sent to
  //     the client) so logout can revoke them at SSO instead of only
  //     forgetting the local session.
  // WHY: Without this, messmass had no way to end the SSO-side session at
  //     all -- logging out only cleared messmass's own cookie while the SSO
  //     tokens (and often SSO's own browser session) stayed live, so the
  //     very next SSO redirect silently signed the user back in.
  if (ssoTokens?.access_token) {
    response.cookies.set(SSO_TOKENS_COOKIE, JSON.stringify(ssoTokens), cookieOpts);
  }

  return { userId, role: user.role };
}
