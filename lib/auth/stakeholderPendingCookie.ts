// lib/auth/stakeholderPendingCookie.ts
// WHAT: Short-lived cookie carrying OAuth `state` across the redirect round-trip
//     to SSO and back, for the stakeholder login flow specifically.
// WHY: Mirrors lib/auth/oauthPendingCookie.ts exactly, but under its own cookie
//     name -- a person could have an admin login and a stakeholder login
//     in flight in the same browser (different tabs), and sharing one pending
//     cookie would let one clobber the other's `state`/`redirectTo`.

import type { NextRequest, NextResponse } from 'next/server';

const PENDING_COOKIE_NAME = 'messmass_stakeholder_pending';
const PENDING_MAX_AGE_SECONDS = 15 * 60;

export interface PendingStakeholderOAuthState {
  state: string;
  codeVerifier?: string;
  createdAt: string;
}

export function setPendingStakeholderOAuthCookie(
  response: NextResponse,
  data: { state: string; codeVerifier?: string }
): void {
  const payload: PendingStakeholderOAuthState = { ...data, createdAt: new Date().toISOString() };
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(PENDING_COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: PENDING_MAX_AGE_SECONDS,
    path: '/',
  });
}

export function readPendingStakeholderOAuthCookie(request: NextRequest): PendingStakeholderOAuthState | null {
  const raw = request.cookies.get(PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingStakeholderOAuthState;
    if (typeof parsed.state !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingStakeholderOAuthCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(PENDING_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
