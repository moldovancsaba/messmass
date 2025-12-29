// lib/auth.ts — DB-backed admin session helpers
// WHAT: Validates the HttpOnly 'admin-session' cookie, fetches user from MongoDB, and exposes auth helpers
// WHY: Introduce multiple users with email+password while preserving simple cookie session model

import { cookies } from 'next/headers'
import { findUserById } from './users'
import { validateSessionToken, type SessionTokenData } from './sessionTokens'
import { debug, warn } from './logger'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'guest' | 'user' | 'admin' | 'superadmin' | 'api' // WHAT: Support 4-tier role hierarchy + legacy 'api'
  permissions: string[]
  // WHAT: API access fields (v10.6.0+)
  // WHY: Track API key usage and status for external integrations
  apiKeyEnabled?: boolean
  apiUsageCount?: number
  lastAPICallAt?: string
}

/**
 * decodeSessionToken
 * WHAT: Decodes and validates session token (supports both JWT and Base64 formats)
 * WHY: Zero-downtime migration - supports both token formats during transition
 * HOW: Uses unified validation function that auto-detects format
 * 
 * @deprecated Use validateSessionToken from lib/sessionTokens.ts directly
 * This function is kept for backward compatibility but delegates to the new system
 */
function decodeSessionToken(sessionToken: string, format?: 'jwt' | 'legacy'): SessionTokenData | null {
  // WHAT: Use unified validation function
  // WHY: Supports both JWT and Base64 formats
  const tokenData = validateSessionToken(sessionToken, format)
  
  if (!tokenData) {
    return null
  }
  
  // WHAT: Normalize historical role values (e.g., 'super-admin' → 'superadmin')
  // WHY: Backward compatibility with old tokens
  // NOTE: Type assertion needed because old tokens may have 'super-admin' string
  const roleRaw = tokenData.role as string;
  const normalizedRole = (roleRaw === 'super-admin' ? 'superadmin' : tokenData.role) as SessionTokenData['role'];
  
  return { ...tokenData, role: normalizedRole }
}

/**
 * getAdminUser
 * Reads the admin-session cookie, validates it, then fetches the user from DB.
 * Returns a sanitized AdminUser or null.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  const sessionFormat = cookieStore.get('session-format')?.value as 'jwt' | 'legacy' | undefined
  
  // WHAT: Log authentication check (debug level, no PII)
  // WHY: Security monitoring and debugging
  debug('getAdminUser called', { hasCookie: !!adminSession?.value, format: sessionFormat })
  
  if (!adminSession?.value) {
    debug('No admin-session cookie found')
    return null
  }

  // WHAT: Validate token with format hint (if available)
  // WHY: Route to correct validator (JWT vs Base64)
  const tokenData = decodeSessionToken(adminSession.value, sessionFormat)
  if (!tokenData) {
    warn('Token validation failed', { format: sessionFormat })
    return null
  }

  debug('Token valid, fetching user', { userId: tokenData.userId })
  const user = await findUserById(tokenData.userId)
  if (!user) {
    warn('User not found in database', { userId: tokenData.userId })
    return null
  }
  
  debug('User authenticated', { email: user.email })

  // Map DB user to AdminUser view model; permissions derived from role
  const basePermissions = ['read', 'write', 'delete', 'manage-users']
  const permissions = user.role === 'superadmin' ? basePermissions : basePermissions

  return {
    id: user._id!.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions,
    // WHAT: Include API access fields in AdminUser view model
    // WHY: Frontend needs these for display and toggle functionality
    apiKeyEnabled: user.apiKeyEnabled,
    apiUsageCount: user.apiUsageCount,
    lastAPICallAt: user.lastAPICallAt
  }
}

/**
 * isAuthenticated
 * Convenience helper for boolean checks.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAdminUser()
  return user !== null
}

/**
 * hasPermission
 * Simplified permission check based on role+permissions.
 * WHAT: Support 4-tier role hierarchy with superadmin having all permissions
 * WHY: Maintain backward compatibility while enabling granular access control
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getAdminUser()
  if (!user) return false
  // WHAT: Superadmin has all permissions (backward compatible with 'super-admin')
  if (user.role === 'superadmin') return true
  return user.permissions.includes(permission)
}

/**
 * logoutAdmin
 * Clears the cookie via API and returns suggested redirect.
 */
export async function logoutAdmin(): Promise<string> {
  try {
    await fetch('/api/admin/login', { method: 'DELETE' })
  } catch (error) {
    console.error('Logout error:', error)
  }
  return '/admin/login'
}
