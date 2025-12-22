// lib/routeProtection.ts
// WHAT: Route-level access control for role-based permissions
// WHY: Protect admin routes based on user roles, redirect unauthorized access
// HOW: Maps routes to minimum required roles, used by middleware

import type { UserRole } from './users';
import { hasMinimumRole } from './permissions';

/**
 * WHAT: Route-to-role mapping for access control
 * WHY: Define minimum role required to access each admin route
 * FORMAT: { route: minimumRole }
 */
export const ROUTE_PROTECTION: Record<string, UserRole> = {
  // WHAT: Main admin dashboard - accessible to all authenticated users (cards filtered by role)
  '/admin': 'guest',
  
  // WHAT: Help page - accessible to all authenticated users (guests can read docs)
  '/admin/help': 'guest',
  
  // WHAT: Core features - user level required
  '/admin/partners': 'user',
  '/admin/events': 'user',
  '/admin/filter': 'user',
  
  // WHAT: Management features - admin level required
  '/admin/kyc': 'admin',
  '/admin/charts': 'admin',
  '/admin/clicker-manager': 'admin',
  '/admin/bitly': 'admin',
  '/admin/visualization': 'admin',
  '/admin/design': 'admin',
  
  // WHAT: System administration - superadmin only
  '/admin/hashtags': 'superadmin',
  '/admin/categories': 'superadmin',
  '/admin/insights': 'superadmin',
  '/admin/users': 'superadmin',
  '/admin/cache': 'superadmin',
};

/**
 * WHAT: Get minimum required role for a route
 * WHY: Lookup route protection rules with fallback
 * RETURNS: Required role or 'user' as default for unspecified routes
 */
export function getRequiredRole(pathname: string): UserRole {
  // WHAT: Direct match - exact route
  if (ROUTE_PROTECTION[pathname]) {
    return ROUTE_PROTECTION[pathname];
  }
  
  // WHAT: Prefix match - check if route starts with protected path
  // WHY: Handle dynamic routes like /admin/events/[id]
  const matchingRoute = Object.keys(ROUTE_PROTECTION).find(route => 
    pathname.startsWith(route)
  );
  
  if (matchingRoute) {
    return ROUTE_PROTECTION[matchingRoute];
  }
  
  // WHAT: Default protection level for unspecified admin routes
  // WHY: Secure by default - require 'user' level for any admin route
  return 'user';
}

/**
 * WHAT: Check if user can access a route based on role
 * WHY: Reusable access check for middleware and client-side routing
 */
export function canAccessRoute(userRole: UserRole | undefined, pathname: string): boolean {
  if (!userRole) return false;
  const requiredRole = getRequiredRole(pathname);
  return hasMinimumRole(userRole, requiredRole);
}

/**
 * WHAT: Get appropriate redirect path for unauthorized access
 * WHY: Smart redirects based on user role - don't trap users in redirect loops
 * LOGIC:
 *   - Guests → /admin/help (only accessible page)
 *   - Users/admins → /admin/help (fallback to safe page)
 *   - Unauthenticated → /admin/login
 */
export function getUnauthorizedRedirect(userRole: UserRole | undefined): string {
  if (!userRole) {
    return '/admin/login';
  }
  
  // WHAT: All authenticated users can at least access help
  // WHY: Provide useful landing page instead of error
  return '/admin/help';
}

/**
 * WHAT: Check if route is public (no authentication required)
 * WHY: Allow access to login/register/clear-session without authentication
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/admin/login',
    '/admin/register',
    '/admin/clear-session',
  ];
  return publicRoutes.some(route => pathname.startsWith(route));
}
