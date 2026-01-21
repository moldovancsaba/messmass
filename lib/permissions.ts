// lib/permissions.ts
// WHAT: Role-based access control (RBAC) permission definitions
// WHY: Centralized permission management for menu visibility and route protection
// HOW: Maps roles to accessible features, used by Sidebar and middleware

import type { UserRole } from './users';

/**
 * WHAT: Role hierarchy definition
 * WHY: Define privilege levels for access control checks
 * HIERARCHY: guest < user < admin < superadmin
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  admin: 2,
  superadmin: 3,
};

/**
 * WHAT: Menu item permission mapping
 * WHY: Control sidebar navigation visibility based on user role
 * FORMAT: { label: [allowed roles] }
 */
export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  // WHAT: Help section - accessible to all authenticated users
  'User Guide': ['guest', 'user', 'admin', 'superadmin'],
  
  // WHAT: Core features - user level and above
  'Partners': ['user', 'admin', 'superadmin'],
  'Events': ['user', 'admin', 'superadmin'],
  'Filters': ['user', 'admin', 'superadmin'],
  
  // WHAT: Management features - admin level and above
  'KYC': ['admin', 'superadmin'],
  'Algorithms': ['admin', 'superadmin'],
  'Clicker Manager': ['admin', 'superadmin'],
  'Bitly Manager': ['admin', 'superadmin'],
  'Reporting': ['admin', 'superadmin'],
  'Style Editor': ['admin', 'superadmin'],
  
  // WHAT: System administration - superadmin only
  'Hashtag Manager': ['superadmin'],
  'Category Manager': ['superadmin'],
  'Insights': ['superadmin'],
  'Users': ['superadmin'],
  'Cache Management': ['superadmin'],
};

/**
 * WHAT: Check if user role can access a menu item
 * WHY: Reusable utility for sidebar filtering
 * NOTE: In SSO systems, 'admin' role is treated as highest privilege (equivalent to superadmin)
 */
export function canAccessMenuItem(userRole: UserRole | undefined, menuLabel: string): boolean {
  if (!userRole) return false;
  
  // WHAT: SSO systems use 'admin' as highest privilege (no superadmin)
  // WHY: Treat 'admin' role as equivalent to 'superadmin' for menu access
  // HOW: Map 'admin' to superadmin for permission checks
  const effectiveRole: UserRole = userRole === 'admin' ? 'superadmin' : userRole;
  
  const allowedRoles = MENU_PERMISSIONS[menuLabel];
  if (!allowedRoles) return false;
  return allowedRoles.includes(effectiveRole);
}

/**
 * WHAT: Check if user role has minimum required privilege level
 * WHY: Generic permission check for role hierarchy
 * NOTE: In SSO systems, 'admin' role is treated as highest privilege (equivalent to superadmin)
 */
export function hasMinimumRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // WHAT: SSO systems use 'admin' as highest privilege (no superadmin)
  // WHY: Treat 'admin' role as equivalent to 'superadmin' for access control
  // HOW: Map 'admin' to superadmin level for permission checks
  const effectiveRole: UserRole = userRole === 'admin' ? 'superadmin' : userRole;
  
  const userLevel = ROLE_HIERARCHY[effectiveRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * WHAT: Get user-friendly role display name
 * WHY: Consistent role labels across UI
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    guest: 'Guest',
    user: 'User',
    admin: 'Admin',
    superadmin: 'Superadmin',
  };
  return displayNames[role] || role;
}

/**
 * WHAT: Get role badge color for UI
 * WHY: Visual differentiation of role levels
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    guest: '#9ca3af',      // Gray - limited access
    user: '#3b82f6',       // Blue - standard access
    admin: '#10b981',      // Green - elevated access
    superadmin: '#8b5cf6', // Purple - full access
  };
  return colors[role] || '#6b7280';
}
