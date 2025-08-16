// lib/auth.ts - Create this new file for authentication utilities
import { cookies } from 'next/headers'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'super-admin'
  permissions: string[]
}

// Mock admin user for development
const DEV_ADMIN_USER: AdminUser = {
  id: 'dev-admin-001',
  name: 'Development Admin',
  email: 'admin@localhost',
  role: 'super-admin',
  permissions: ['read', 'write', 'delete', 'manage-users']
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin-session')
  
  if (!adminSession) {
    return null
  }
  
  // In development, return mock user
  if (process.env.NODE_ENV === 'development' && adminSession.value === 'local-dev-admin') {
    return DEV_ADMIN_USER
  }
  
  // In production, validate session with SSO
  try {
    const response = await fetch(`https://sso.doneisbetter.com/api/validate`, {
      headers: {
        'Authorization': `Bearer ${adminSession.value}`,
        'X-App': 'messmass'
      }
    })
    
    if (response.ok) {
      const userData = await response.json()
      return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'admin',
        permissions: userData.permissions || ['read', 'write']
      }
    }
  } catch (error) {
    console.error('SSO validation error:', error)
  }
  
  return null
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAdminUser()
  return user !== null
}

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getAdminUser()
  return user?.permissions.includes(permission) || user?.role === 'super-admin' || false
}

export function logoutAdmin() {
  // Clear admin session
  const cookieStore = cookies()
  cookieStore.delete('admin-session')
  
  // In production, also notify SSO
  if (process.env.NODE_ENV === 'production') {
    // This would be called client-side to redirect to SSO logout
    return `https://sso.doneisbetter.com/logout?app=messmass&return_url=${encodeURIComponent(window.location.origin)}`
  }
  
  return '/admin'
}