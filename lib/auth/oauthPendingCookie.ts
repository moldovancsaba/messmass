// lib/auth/oauthPendingCookie.ts
// WHAT: Short-lived cookie carrying OAuth `state` (and PKCE `code_verifier`, when
//      not running confidential) across the redirect round-trip to SSO and back.
// WHY: The callback must be able to verify `state` came from a login this server
//      actually initiated (CSRF protection) without a server-side session store.

import type { NextRequest, NextResponse } from 'next/server';

const PENDING_COOKIE_NAME = 'messmass_sso_pending';
const PENDING_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

export interface PendingOAuthState {
  state: string;
  codeVerifier?: string;
  redirectTo: string;
  createdAt: string;
}

export function setPendingOAuthCookie(
  response: NextResponse,
  data: { state: string; codeVerifier?: string; redirectTo: string }
): void {
  const payload: PendingOAuthState = { ...data, createdAt: new Date().toISOString() };
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(PENDING_COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: PENDING_MAX_AGE_SECONDS,
    path: '/',
  });
}

export function readPendingOAuthCookie(request: NextRequest): PendingOAuthState | null {
  const raw = request.cookies.get(PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingOAuthState;
    if (typeof parsed.state !== 'string' || typeof parsed.redirectTo !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingOAuthCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(PENDING_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
