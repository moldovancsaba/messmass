// app/api/auth/sso/login/route.ts
// WHAT: Redirect to DoneIsBetter SSO login with callback_uri to our callback
// WHY: #46 — single entry point for "Sign in with DoneIsBetter" on login page

import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  const base = config.ssoBaseUrl?.replace(/\/$/, '');
  if (!base) {
    return NextResponse.redirect(new URL('/admin/login?error=sso_not_configured', request.url));
  }
  const origin = request.headers.get('x-forwarded-proto')
    ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host') || request.headers.get('host')}`
    : request.nextUrl.origin;
  const callbackUrl = `${origin}/api/auth/sso/callback`;
  const redirectUri = request.nextUrl.searchParams.get('redirect_uri') || '/admin';
  const ssoLoginUrl = `${base}/login?redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(redirectUri)}`;
  return NextResponse.redirect(ssoLoginUrl);
}
