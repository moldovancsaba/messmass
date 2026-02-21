// app/api/auth/sso/config/route.ts
// WHAT: Public config for login page — whether SSO is enabled and login URL
// WHY: #46 — client needs to show "Sign in with DoneIsBetter" and redirect to SSO

import { NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET() {
  const enabled = Boolean(config.ssoBaseUrl?.trim());
  return NextResponse.json({
    ssoEnabled: enabled,
    // Client uses /api/auth/sso/login as href (server builds full SSO URL on redirect)
    ssoLoginPath: '/api/auth/sso/login',
  });
}
