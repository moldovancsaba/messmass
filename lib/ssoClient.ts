// lib/ssoClient.ts
// WHAT: DoneIsBetter SSO session validation client
// WHY: Centralize SSO token validation for admin/dashboard access (#46)
// HOW: Calls SSO_BASE_URL /api/validate with Bearer token; no session creation here

import config from './config';
import { debug, warn } from './logger';

export interface SSOUser {
  name: string;
  email: string;
  role: string;
  id?: string;
}

/**
 * Whether SSO is configured (SSO_BASE_URL set).
 * When false, all SSO checks are skipped and local auth only applies.
 */
export function isSSOConfigured(): boolean {
  return Boolean(config.ssoBaseUrl?.trim());
}

/**
 * Validate a Bearer token with the DoneIsBetter SSO service.
 * Returns the user payload from the SSO response or null if invalid/missing.
 */
export async function validateSSOSession(token: string): Promise<SSOUser | null> {
  if (!config.ssoBaseUrl?.trim()) {
    debug('SSO not configured; skipping validation');
    return null;
  }
  const base = config.ssoBaseUrl.replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/api/validate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      debug('SSO validate non-OK', { status: response.status });
      return null;
    }
    const data = (await response.json()) as { user?: SSOUser };
    const user = data?.user;
    if (!user || typeof user.email !== 'string') {
      warn('SSO validate response missing user or email');
      return null;
    }
    return {
      name: typeof user.name === 'string' ? user.name : user.email,
      email: user.email,
      role: typeof user.role === 'string' ? user.role : 'user',
      id: user.id,
    };
  } catch (error) {
    warn('SSO validation request failed', { message: error instanceof Error ? error.message : String(error) });
    return null;
  }
}
