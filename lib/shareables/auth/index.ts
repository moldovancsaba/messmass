// lib/shareables/auth/index.ts
// Central export file for MessMass Authentication System

import React from 'react'
import type { AuthUser, UserRole, LoginResponse } from './types'
import type { LoginFormProps } from './LoginForm'

/**
 * MessMass Authentication System
 * 
 * A complete, reusable authentication system extracted from MessMass.
 * Provides password-based authentication with session management,
 * React context provider, and beautiful UI components.
 * 
 * Features:
 * - 🔐 Simple password-based authentication
 * - 🍪 Secure session management with cookies
 * - ⚛️ React context provider with hooks
 * - 🎨 Glass-morphism styled login form
 * - 🔒 TypeScript support with full type safety
 * - 📱 Responsive design for all screen sizes
 * - 🛡️ Built-in security features (brute force protection, etc.)
 * - 🚀 SSR/SSG compatible
 * - 🧪 Configurable and extensible
 * 
 * Quick Start:
 * ```tsx
 * import { AuthProvider, LoginForm, useAuth } from '@/lib/shareables/auth'
 * 
 * function App() {
 *   return (
 *     <AuthProvider adminPassword="mySecret123">
 *       <MyAppContent />
 *     </AuthProvider>
 *   )
 * }
 * 
 * function LoginPage() {
 *   return (
 *     <LoginForm
 *       title="My App Login"
 *       onLoginSuccess={() => router.push('/dashboard')}
 *     />
 *   )
 * }
 * 
 * function ProtectedComponent() {
 *   const { user, logout } = useAuth()
 *   return <div>Hello, {user?.name}!</div>
 * }
 * ```
 */

// Type Definitions
export type {
  // Core Types
  AuthUser,
  UserRole,
  AuthState,
  AuthContextType,
  AuthConfig,
  
  // Login Types
  LoginCredentials,
  LoginResponse,
  SessionTokenData,
  
  // Function Types
  UseAuthReturn,
  PermissionChecker
} from './types'

// Component Props (from separate files)
export type { LoginFormProps } from './LoginForm'
export type { AuthProviderProps } from './AuthProvider'

// Constants
export {
  DEFAULT_AUTH_CONFIG,
  PERMISSIONS,
  hasRole,
  hasPermission
} from './types'

// Authentication Utilities
export {
  // Token Management
  generateSessionToken,
  createSessionTokenData,
  encodeSessionToken,
  decodeSessionToken,
  isValidSessionToken,
  
  // Password Authentication
  validatePassword,
  authenticateUser,
  getUserFromSession,
  isAuthenticated,
  logoutUser,
  validatePasswordStrength
} from './passwordAuth'

// Session Management
export {
  // Cookie Management
  setSessionCookie,
  getSessionCookie,
  removeSessionCookie,
  
  // Session Validation
  getCurrentSessionUser,
  isCurrentSessionValid,
  refreshSession,
  clearSession,
  setupSessionMonitoring,
  
  // Server-Side Utilities
  getServerSessionUser,
  isServerSessionValid,
  createServerCookieString,
  createServerLogoutCookieString,
  
  // Debugging
  getSessionDebugInfo
} from './session'

// React Components and Hooks
export {
  // Main Components
  default as AuthProvider,
  
  // Hooks
  useAuth,
  useAuthUser,
  useAuthActions,
  
  // Higher-Order Components
  AuthGuard,
  withAuth
} from './AuthProvider'

// Login Form Component
export { default as LoginForm } from './LoginForm'
export { default as LoginFormComponent } from './LoginForm'

/**
 * Pre-configured Authentication Setup
 * 
 * Convenience function to set up authentication with common defaults.
 * Returns configured components for immediate use.
 */
export function createAuthSystem(config: {
  adminPassword: string
  appName?: string
  redirectAfterLogin?: string
  enableSessionMonitoring?: boolean
}) {
  const {
    adminPassword,
    appName = 'Admin Panel',
    redirectAfterLogin = '/dashboard',
    enableSessionMonitoring = true
  } = config

  // Import components dynamically
  const AuthProvider = require('./AuthProvider').default
  const LoginForm = require('./LoginForm').default
  const { useAuth, useAuthUser, useAuthActions, AuthGuard } = require('./AuthProvider')

  // Pre-configured AuthProvider
  function ConfiguredAuthProvider({ children }: { children: React.ReactNode }) {
    return React.createElement(AuthProvider, {
      adminPassword,
      enableSessionMonitoring,
      config: { redirectAfterLogin }
    }, children)
  }

  // Pre-configured LoginForm
  function ConfiguredLoginForm(props: Partial<LoginFormProps>) {
    return React.createElement(LoginForm, {
      title: `${appName} Login`,
      subtitle: `Enter admin password to access ${appName.toLowerCase()}`,
      adminPassword,
      redirectUrl: redirectAfterLogin,
      ...props
    })
  }

  return {
    AuthProvider: ConfiguredAuthProvider,
    LoginForm: ConfiguredLoginForm,
    useAuth,
    useAuthUser,
    useAuthActions,
    AuthGuard
  }
}

/**
 * Authentication Validation Helpers
 * 
 * Utility functions for common authentication checks.
 */
export const authHelpers = {
  /**
   * Check if user has admin access
   */
  isAdmin: (user: AuthUser | null): boolean => {
    return user?.role === 'admin' || user?.role === 'superadmin'
  },

  /**
   * Check if user has super admin access
   */
  isSuperAdmin: (user: AuthUser | null): boolean => {
    return user?.role === 'superadmin'
  },

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission: (user: AuthUser | null, permissions: string[]): boolean => {
    if (!user) return false
    if (user.role === 'superadmin') return true
    return permissions.some(permission => user.permissions.includes(permission))
  },

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions: (user: AuthUser | null, permissions: string[]): boolean => {
    if (!user) return false
    if (user.role === 'superadmin') return true
    return permissions.every(permission => user.permissions.includes(permission))
  },

  /**
   * Get user display name
   */
  getUserDisplayName: (user: AuthUser | null): string => {
    return user?.name || user?.email || 'Unknown User'
  },

  /**
   * Format user role for display
   */
  formatRole: (role: UserRole): string => {
    switch (role) {
      case 'superadmin': return 'Super Administrator'
      case 'admin': return 'Administrator'
      case 'user': return 'User'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }
}

/**
 * Development Utilities
 * 
 * Helper functions for development and debugging.
 * Only available in non-production environments.
 */
export const devUtils = {
  /**
   * Create mock user for testing
   */
  createMockUser: (overrides: Partial<AuthUser> = {}): AuthUser => {
    return {
      id: 'mock-user-id',
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'admin',
      permissions: ['read', 'write'],
      ...overrides
    }
  },

  /**
   * Create mock login response
   */
  createMockLoginResponse: (success = true, user?: Partial<AuthUser>): LoginResponse => {
    if (success) {
      return {
        success: true,
        user: devUtils.createMockUser(user),
        token: 'mock-session-token',
        message: 'Login successful'
      }
    } else {
      return {
        success: false,
        error: 'Invalid credentials',
        message: 'Authentication failed'
      }
    }
  },

  /**
   * Log authentication state (development only)
   */
  logAuthState: (user: AuthUser | null, context = 'Auth State') => {
    if (process.env.NODE_ENV !== 'development') return
    
    console.group(`🔐 ${context}`)
    console.log('Authenticated:', !!user)
    console.log('User:', user)
    if (user) {
      console.log('Role:', user.role)
      console.log('Permissions:', user.permissions)
    }
    console.groupEnd()
  }
}

// Re-export LoginForm as default for convenience
export { default } from './LoginForm'
