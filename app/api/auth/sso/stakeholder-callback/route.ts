// app/api/auth/sso/stakeholder-callback/route.ts
// WHAT: OAuth2/OIDC callback for the stakeholder login flow. Exchanges the
//     authorization code (identical exchange to admin login -- same SSO
//     client, same protocol), then looks up the verified email in messmass's
//     own stakeholder_grants collection instead of provisioning an admin user.
// WHY: messmass#231. SSO proves identity; it has no concept of "sponsor" vs
//     "agency" vs "media" access to messmass reports, so that authorization
//     decision is made here, locally, against a grant an admin created via
//     POST /api/stakeholder/invite. Deliberately does NOT call
//     lib/auth/ssoPermissions.ts's getAppPermission/hasAppAccess -- that gate
//     is "does this person have STAFF access to messmass's admin app", a
//     different question from "is this email an invited stakeholder", and
//     requiring the former would mean every sponsor needs an SSO-side staff
//     permission grant just to see their own report.

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeIdToken,
  exchangeCodeForToken,
  getStakeholderOAuthCallbackRedirectUri,
  getUserInfo,
  shouldUseConfidentialOAuth,
} from '@/lib/auth/ssoOAuth';
import { findGrantByEmail, activateGrant } from '@/lib/stakeholderGrants';
import { mintStakeholderSession } from '@/lib/auth/stakeholderSession';
import {
  clearPendingStakeholderOAuthCookie,
  readPendingStakeholderOAuthCookie,
} from '@/lib/auth/stakeholderPendingCookie';
import { error as logError } from '@/lib/logger';
import config from '@/lib/config';

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/stakeholder-access?error=${error}`, request.url));
  clearPendingStakeholderOAuthCookie(response);
  return response;
}

/** Existing public report route for each scope type (see #244 lib/reportVariants.ts owner types). */
function reportPathFor(scopeType: string, scopeId: string): string {
  switch (scopeType) {
    case 'partner':
      return `/partner-report/${encodeURIComponent(scopeId)}`;
    case 'organization':
      return `/organization-report/${encodeURIComponent(scopeId)}`;
    case 'hashtag':
      return `/hashtag/${encodeURIComponent(scopeId)}`;
    case 'filter':
      return `/filter/${encodeURIComponent(scopeId)}`;
    default:
      return '/';
  }
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
      logError('Stakeholder SSO OAuth error', { error: oauthError }, new Error(oauthError));
      return redirectWithError(request, 'sso_oauth_error');
    }
    if (!code || !state) {
      return redirectWithError(request, 'missing_code');
    }

    const pending = readPendingStakeholderOAuthCookie(request);
    if (!pending || pending.state !== state) {
      return redirectWithError(request, 'session_expired');
    }

    const confidential = shouldUseConfidentialOAuth();
    const redirectUri = getStakeholderOAuthCallbackRedirectUri(request);

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
        logError('Stakeholder SSO userinfo enrichment failed', {}, e instanceof Error ? e : new Error(String(e)));
      }
    }

    if (!ssoUser.email || badEmail) {
      return redirectWithError(request, 'no_email');
    }

    const grant = await findGrantByEmail(ssoUser.email);
    if (!grant) {
      logError('Stakeholder login denied: no grant for email', { email: ssoUser.email });
      return redirectWithError(request, 'not_invited');
    }

    await activateGrant(grant._id, ssoUser.id);

    const response = NextResponse.redirect(new URL(reportPathFor(grant.scopeType, grant.scopeId), request.url));
    clearPendingStakeholderOAuthCookie(response);
    mintStakeholderSession(response, {
      grantId: grant._id.toString(),
      email: grant.email,
      role: grant.role,
      scopeType: grant.scopeType,
      scopeId: grant.scopeId,
    });

    return response;
  } catch (error) {
    logError('Stakeholder SSO callback failed', {}, error instanceof Error ? error : new Error(String(error)));
    return redirectWithError(request, 'auth_failed');
  }
}
