// lib/auth/ssoOAuth.ts
// WHAT: OAuth2/OIDC authorization code (+ PKCE) client for sso.doneisbetter.com.
// WHY: Replaces the old token-validate-only "Sign in with DoneIsBetter" shortcut
//     (lib/ssoClient.ts) with a real, registered OAuth client — the same protocol
//     camera and launchmass already use in production against the same SSO server.
// HOW: Ported from camera/lib/auth/sso.ts (proven implementation), adapted to
//     messmass's config.ts/env conventions. See SSO_EMAIL_UNIFICATION_PLAN.md.
//
// Confidential vs PKCE: messmass is registered on SSO as a confidential client
// (SSO_CLIENT_SECRET set, token exchange happens server-side only in a Next.js
// route handler, never in the browser) so PKCE is not required — set
// SSO_CONFIDENTIAL_OAUTH=1 (messmass's default). Set it to '0'/unset only if
// this client is ever re-registered as public.

import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import config from '@/lib/config';

function getSSOConfig() {
  if (!config.ssoBaseUrl) {
    throw new Error('SSO_BASE_URL environment variable is not defined');
  }
  if (!config.ssoClientId) {
    throw new Error('SSO_CLIENT_ID environment variable is not defined');
  }
  return {
    baseUrl: config.ssoBaseUrl,
    clientId: config.ssoClientId,
    scopes: ['openid', 'profile', 'email'],
  } as const;
}

function getPublicOriginFromRequest(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();

  const host = forwardedHost || hostHeader;
  if (host) {
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');
    const safeProto = proto === 'http' || proto === 'https' ? proto : 'https';
    try {
      const u = new URL(`${safeProto}://${host}`);
      if (u.port === '443' && u.protocol === 'https:') u.port = '';
      if (u.port === '80' && u.protocol === 'http:') u.port = '';
      return u.origin;
    } catch {
      // fall through
    }
  }
  return new URL(request.url).origin;
}

/** OAuth2 redirect_uri, built from the request's public host (matches SSO client allowlist). */
export function getOAuthCallbackRedirectUri(request: NextRequest): string {
  const origin = getPublicOriginFromRequest(request);
  return new URL('/api/auth/sso/callback', origin).href;
}

function getSSOEndpoints() {
  const c = getSSOConfig();
  return {
    authorize: `${c.baseUrl}/api/oauth/authorize`,
    token: `${c.baseUrl}/api/oauth/token`,
    userinfo: `${c.baseUrl}/api/oauth/userinfo`,
    revoke: `${c.baseUrl}/api/oauth/revoke`,
  } as const;
}

export const SSO_CONFIG = getSSOConfig;
export const SSO_ENDPOINTS = getSSOEndpoints;

/** Confidential (no PKCE) when SSO_CLIENT_SECRET is set and SSO_CONFIDENTIAL_OAUTH is not disabled. */
export function shouldUseConfidentialOAuth(): boolean {
  const disabled = process.env.SSO_CONFIDENTIAL_OAUTH === '0' || process.env.SSO_CONFIDENTIAL_OAUTH === 'false';
  if (disabled) return false;
  return Boolean(config.ssoClientSecret?.trim());
}

export interface SSOUser {
  id: string;
  email: string;
  name?: string;
  email_verified?: boolean;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

export function generatePKCEPair(): PKCEPair {
  const codeVerifier = generateCodeVerifier();
  return { codeVerifier, codeChallenge: generateCodeChallenge(codeVerifier) };
}

export function generateState(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

export function getAuthorizationUrl(
  codeChallenge: string | null,
  state: string,
  options: { redirectUri: string; prompt?: 'login' | 'consent' | 'none' | 'select_account' }
): string {
  const c = SSO_CONFIG();
  const endpoints = SSO_ENDPOINTS();

  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: options.redirectUri,
    response_type: 'code',
    scope: c.scopes.join(' '),
    state,
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }
  if (options.prompt) params.set('prompt', options.prompt);

  return `${endpoints.authorize}?${params.toString()}`;
}

/** Exchange authorization code for tokens. Pass codeVerifier for PKCE, or rely on SSO_CLIENT_SECRET for confidential exchange. */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const c = SSO_CONFIG();
  const endpoints = SSO_ENDPOINTS();

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: c.clientId,
  });

  const verifier = codeVerifier?.trim();
  if (verifier) {
    params.set('code_verifier', verifier);
  } else {
    const secret = config.ssoClientSecret?.trim();
    if (!secret) {
      throw new Error('SSO_CLIENT_SECRET is required for token exchange without a PKCE code_verifier');
    }
    params.set('client_secret', secret);
  }

  const response = await fetch(endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }
  return response.json();
}

/** Decode the OIDC ID token (JWT) without verifying the signature — SSO is the trusted issuer of this response over TLS. */
export function decodeIdToken(idToken: string): SSOUser {
  if (!idToken) throw new Error('ID token is required');
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  const userEmail = payload.email || payload.preferred_username || payload.upn || 'unknown@unknown.com';
  const userName = payload.name || payload.given_name || payload.display_name || undefined;

  return {
    id: payload.sub,
    email: userEmail,
    name: userName,
    email_verified: payload.email_verified,
    role: payload.role,
  };
}

/** OIDC UserInfo fallback — use when the ID token lacks a usable email. */
export async function getUserInfo(accessToken: string): Promise<SSOUser> {
  const endpoints = SSO_ENDPOINTS();
  const response = await fetch(endpoints.userinfo, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${response.status} ${error}`);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email =
    (typeof payload.email === 'string' && payload.email) ||
    (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
    '';
  return {
    id: sub,
    email,
    name: (typeof payload.name === 'string' && payload.name) || undefined,
    email_verified: typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
    role: typeof payload.role === 'string' ? payload.role : undefined,
  };
}

// WHAT: Best-effort revocation, bounded to 3s.
// WHY: This runs inline in the logout request (see app/api/admin/login's
//     DELETE handler) -- an unresponsive SSO revoke endpoint must not be
//     able to hang the whole logout request and leave the local session
//     cookie un-cleared.
export async function revokeToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
  const c = SSO_CONFIG();
  const endpoints = SSO_ENDPOINTS();
  const params = new URLSearchParams({ token, token_type_hint: tokenTypeHint, client_id: c.clientId });
  const response = await fetch(endpoints.revoke, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) {
    console.error('SSO token revocation failed:', response.status);
  }
}
