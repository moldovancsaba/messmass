// app/api/auth/sso/stakeholder-login/route.ts
// WHAT: Initiates OAuth2/OIDC login against sso.doneisbetter.com for an
//     external stakeholder (sponsor/agency/media/operator) -- the same
//     protocol and the same registered client as admin login
//     (app/api/auth/sso/login/route.ts), just a different callback.
// WHY: messmass#231. SSO already runs a complete, production-grade public-user
//     passwordless/social login (confirmed by reading sso's own
//     pages/api/oauth/authorize.js: "user_type: 'public', // Always public for
//     OAuth flows"). Building a second, bespoke magic-link system in messmass
//     would have duplicated that -- with none of its single-use token
//     tracking -- for no reason. This route only ever sends people to SSO's
//     real login screen; messmass never sees a password or a magic-link token.

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePKCEPair,
  generateState,
  getAuthorizationUrl,
  getStakeholderOAuthCallbackRedirectUri,
  shouldUseConfidentialOAuth,
} from '@/lib/auth/ssoOAuth';
import { setPendingStakeholderOAuthCookie } from '@/lib/auth/stakeholderPendingCookie';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  if (!config.ssoBaseUrl?.trim() || !config.ssoClientId?.trim()) {
    return NextResponse.json({ success: false, error: 'SSO is not configured.' }, { status: 503 });
  }

  const identifier = getClientIdentifier(request);
  const rl = checkRateLimit(`stakeholder-login:${identifier}`, RATE_LIMITS.AUTH);
  if (!rl.allowed) {
    return NextResponse.json({ error: RATE_LIMITS.AUTH.message }, { status: 429 });
  }

  const redirectUri = getStakeholderOAuthCallbackRedirectUri(request);

  let response: NextResponse;
  if (shouldUseConfidentialOAuth()) {
    const state = generateState();
    const authUrl = getAuthorizationUrl(null, state, { redirectUri });
    response = NextResponse.redirect(authUrl);
    setPendingStakeholderOAuthCookie(response, { state });
  } else {
    const { codeVerifier, codeChallenge } = generatePKCEPair();
    const state = generateState();
    const authUrl = getAuthorizationUrl(codeChallenge, state, { redirectUri });
    response = NextResponse.redirect(authUrl);
    setPendingStakeholderOAuthCookie(response, { state, codeVerifier });
  }
  return response;
}
