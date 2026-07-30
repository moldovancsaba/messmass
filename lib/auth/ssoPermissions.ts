// lib/auth/ssoPermissions.ts
// WHAT: Client for SSO's central per-app permission store.
// WHY: This is the SAME endpoint camera and launchmass already use in production
//     (GET/PUT /api/users/{userId}/apps/{clientId}/permissions) — messmass joining
//     it is the whole point of unifying "who can access what" across apps instead
//     of each app keeping a separate, disconnected answer.
// HOW: Ported from camera/lib/auth/sso-permissions.ts.

import { SSO_CONFIG } from './ssoOAuth';

export interface AppPermission {
  userId: string;
  clientId: string;
  appName: string;
  hasAccess: boolean;
  status: 'approved' | 'pending' | 'revoked';
  role: 'none' | 'user' | 'admin' | 'superadmin';
  requestedAt?: string;
  grantedAt?: string | null;
  grantedBy?: string | null;
  lastAccessedAt?: string | null;
}

/** Query SSO for this user's messmass-specific permission. 404 (no record yet) maps to "no access". */
export async function getAppPermission(userId: string, accessToken: string): Promise<AppPermission> {
  const c = SSO_CONFIG();
  const url = `${c.baseUrl}/api/users/${userId}/apps/${c.clientId}/permissions`;

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        userId,
        clientId: c.clientId,
        appName: 'messmass',
        hasAccess: false,
        status: 'revoked',
        role: 'none',
      };
    }
    const error = await response.text();
    throw new Error(`Failed to get app permission: ${response.status} ${error}`);
  }
  return response.json();
}

export function hasAppAccess(permission: AppPermission): boolean {
  return permission.hasAccess && permission.status === 'approved';
}

export function isAppAdmin(permission: AppPermission): boolean {
  return hasAppAccess(permission) && (permission.role === 'admin' || permission.role === 'superadmin');
}
