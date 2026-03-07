// app/api/auth/sso/callback/route.ts
// WHAT: DoneIsBetter SSO callback — validate token, create admin session, set auth-source=sso
// WHY: #46 — dashboard requires SSO; this creates the session after SSO redirect
// HOW: GET ?token=...&redirect_uri=...; validate with ssoClient; find user by email; set cookies; redirect

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { findUserByEmail, updateUserLastLogin, type UserRole } from '@/lib/users';
import { generateSessionToken, type SessionTokenData } from '@/lib/sessionTokens';
import { validateSSOSession, isSSOConfigured } from '@/lib/ssoClient';
import { logAuthSuccess, error as logError } from '@/lib/logger';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import config from '@/lib/config';

const AUTH_SOURCE_COOKIE = 'auth-source';

export async function GET(request: NextRequest) {
  if (!isSSOConfigured()) {
    return NextResponse.redirect(new URL('/admin/login?error=sso_not_configured', request.url));
  }
  const token = request.nextUrl.searchParams.get('token');
  const redirectUri = request.nextUrl.searchParams.get('redirect_uri') ?? request.nextUrl.searchParams.get('state') ?? '/admin/dashboard';
  const safeRedirect = redirectUri.startsWith('/admin') ? redirectUri : '/admin/dashboard';

  if (!token?.trim()) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_token', request.url));
  }

  const ssoUser = await validateSSOSession(token.trim());
  if (!ssoUser) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid_sso', request.url));
  }

  const user = await findUserByEmail(ssoUser.email);
  if (!user) {
    logError('SSO callback: no local user', { email: ssoUser.email }, new Error('No {messmass} account'));
    return NextResponse.redirect(new URL('/admin/login?error=no_account', request.url));
  }

  const tokenData: SessionTokenData = {
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: user._id!.toString(),
    role: (user.role || 'admin') as UserRole,
  };
  const sessionToken = generateSessionToken(tokenData);

  const cookieStore = await cookies();
  const isProduction = config.nodeEnv === 'production';
  const host = request.headers.get('host') || '';
  const domain = isProduction && host.endsWith('messmass.com') ? '.messmass.com' : undefined;

  cookieStore.set('admin-session', '', { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 0, path: '/' });
  cookieStore.set('admin-session', sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    ...(domain && { domain }),
  });
  cookieStore.set(AUTH_SOURCE_COOKIE, 'sso', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    ...(domain && { domain }),
  });
  if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
    cookieStore.set('session-format', 'jwt', {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      ...(domain && { domain }),
    });
  }

  const userId = user._id!.toString();
  try {
    await updateUserLastLogin(userId);
  } catch {
    // non-fatal
  }
  logAuthSuccess(userId, request.headers.get('x-forwarded-for') || undefined);

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  response.cookies.set('admin-session', sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    ...(domain && { domain }),
  });
  response.cookies.set(AUTH_SOURCE_COOKIE, 'sso', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    ...(domain && { domain }),
  });
  if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
    response.cookies.set('session-format', 'jwt', {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      ...(domain && { domain }),
    });
  }
  return response;
}
