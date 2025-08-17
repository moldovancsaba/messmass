// lib/auth.ts - Replace with simple password authentication
import { cookies } from 'next/headers'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'super-admin'
  permissions: string[]
}

// Static admin user for simple password auth
const ADMIN_USER: AdminUser = {
  id: 'admin',
  name: 'MessMass Administrator',
  email: 'admin@messmass.com',
  role: 'super-admin',
  permissions: ['read', 'write', 'delete', 'manage-users']
}

function isValidAdminSession(sessionToken: string): boolean {
  try {
    const tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    
    return now <= expiresAt && tokenData.userId === 'admin' && tokenData.role === 'super-admin'
  } catch (error) {
    return false
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  
  if (!adminSession || !isValidAdminSession(adminSession.value)) {
    return null
  }
  
  return ADMIN_USER
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAdminUser()
  return user !== null
}

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getAdminUser()
  return user?.permissions.includes(permission) || user?.role === 'super-admin' || false
}

export async function logoutAdmin(): Promise<string> {
  try {
    // Call logout API to clear cookie
    await fetch('/api/admin/login', {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  return '/admin/login'
}