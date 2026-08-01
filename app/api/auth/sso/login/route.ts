// app/api/auth/sso/login/route.ts
// WHAT: Initiates real OAuth2/OIDC (Authorization Code + optional PKCE) login
//     against sso.doneisbetter.com, using messmass's own registered OAuth client.
// WHY: #46 replaced the token-validate shortcut (old lib/ssoClient.ts flow) with
//     the same protocol camera/launchmass already run in production. See
//     SSO_EMAIL_UNIFICATION_PLAN.md for the full rationale.

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePKCEPair,
  generateState,
  getAuthorizationUrl,
  getOAuthCallbackRedirectUri,
  shouldUseConfidentialOAuth,
} from '@/lib/auth/ssoOAuth';
import { setPendingOAuthCookie } from '@/lib/auth/oauthPendingCookie';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  if (!config.ssoBaseUrl?.trim() || !config.ssoClientId?.trim()) {
    return NextResponse.redirect(new URL('/admin/login?error=sso_not_configured', request.url));
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`sso-login:${identifier}`, RATE_LIMITS.AUTH);
  if (!rl.allowed) {
    return NextResponse.json({ error: RATE_LIMITS.AUTH.message }, { status: 429 });
  }

  const redirectToParam = request.nextUrl.searchParams.get('redirect_uri');
  const redirectTo = redirectToParam?.startsWith('/admin') ? redirectToParam : '/admin';
  const redirectUri = getOAuthCallbackRedirectUri(request);
  // WHAT: Force SSO to show its real login screen instead of silently
  //     re-approving an existing SSO browser session.
  // WHY: Revoking this app's own SSO tokens at logout doesn't end the
  //     session cookie SSO itself holds -- without this hint, signing back
  //     in right after logging out can look like logout never happened.
  const fromLogout = request.nextUrl.searchParams.get('from_logout') === 'true';

  if (shouldUseConfidentialOAuth()) {
    const state = generateState();
    const authUrl = getAuthorizationUrl(null, state, { redirectUri, prompt: fromLogout ? 'login' : undefined });
    const response = NextResponse.redirect(authUrl);
    setPendingOAuthCookie(response, { state, redirectTo });
    return response;
  }

  const { codeVerifier, codeChallenge } = generatePKCEPair();
  const state = generateState();
  const authUrl = getAuthorizationUrl(codeChallenge, state, { redirectUri, prompt: fromLogout ? 'login' : undefined });
  const response = NextResponse.redirect(authUrl);
  setPendingOAuthCookie(response, { state, codeVerifier, redirectTo });
  return response;
}
