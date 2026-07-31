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
export async function mintMessmassSessionForSsoUser(
  ssoUser: MintableSsoUser,
  permission: AppPermission,
  request: NextRequest,
  response: NextResponse
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

  return { userId, role: user.role };
}
