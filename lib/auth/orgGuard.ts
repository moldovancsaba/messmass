// lib/auth/orgGuard.ts
// WHAT: Centralized authorization logic for organization-level access
// WHY: Ensures strict data isolation in multi-tenant V3 hierarchy

import { getAdminUser, AdminUser } from '../auth';

/**
 * validateOrganizationAccess
 * WHAT: Verifies if the current user has access to a specific organization.
 * WHY: Enforces multi-tenancy at the API layer.
 * 
 * RULES:
 * 1. superadmin: Always has access to all organizations.
 * 2. admin: Access granted ONLY if organizationId is in user.organizationIds.
 * 3. others: Access denied.
 * 
 * @param organizationId The ID of the organization being accessed
 * @returns The authenticated user if access is granted, otherwise null
 */
export async function validateOrganizationAccess(organizationId: string): Promise<AdminUser | null> {
  const user = await getAdminUser();
  if (!user) return null;

  // WHAT: Superadmin bypass
  // WHY: System administrators need global visibility
  if (user.role === 'superadmin') {
    return user;
  }

  // WHAT: Explicit organization assignment check
  // WHY: Non-superadmins must be restricted to their assigned data islands
  if (user.organizationIds && user.organizationIds.includes(organizationId)) {
    return user;
  }

  return null;
}
