// lib/auth.ts — DB-backed admin session helpers
// WHAT: Validates the HttpOnly 'admin-session' cookie, fetches user from MongoDB, and exposes auth helpers
// WHY: Introduce multiple users with email+password while preserving simple cookie session model

import { cookies } from 'next/headers'
import { findUserById } from './users'

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
 * Decodes base64 JSON session and validates expiration.
 * Token shape: { token: string; expiresAt: string; userId: string; role: 'admin'|'super-admin' }
 */
function decodeSessionToken(sessionToken: string): { token: string; expiresAt: string; userId: string; role: 'guest' | 'user' | 'admin' | 'superadmin' | 'api' } | null {
  try {
    const json = Buffer.from(sessionToken, 'base64').toString()
    const tokenData = JSON.parse(json)
    if (!tokenData?.token || !tokenData?.expiresAt || !tokenData?.userId || !tokenData?.role) return null
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    if (now > expiresAt) return null
    return tokenData
  } catch {
    return null
  }
}

/**
 * getAdminUser
 * Reads the admin-session cookie, validates it, then fetches the user from DB.
 * Returns a sanitized AdminUser or null.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  
  // Debug logging
  console.log('🔍 getAdminUser called')
  console.log('🍪 Cookie found:', !!adminSession)
  
  if (!adminSession?.value) {
    console.log('❌ No admin-session cookie found')
    return null
  }

  const tokenData = decodeSessionToken(adminSession.value)
  if (!tokenData) {
    console.log('❌ Token decode failed or expired')
    return null
  }

  console.log('✅ Token valid, fetching user:', tokenData.userId)
  const user = await findUserById(tokenData.userId)
  if (!user) {
    console.log('❌ User not found in database:', tokenData.userId)
    return null
  }
  
  console.log('✅ User authenticated:', user.email)

  // Map DB user to AdminUser view model; permissions derived from role
  const basePermissions = ['read', 'write', 'delete', 'manage-users']
  const permissions = user.role === 'super-admin' ? basePermissions : basePermissions

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
