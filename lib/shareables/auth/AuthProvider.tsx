// lib/shareables/auth/AuthProvider.tsx
// React context provider for authentication state management

'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  AuthContextType, 
  AuthUser, 
  LoginCredentials, 
  LoginResponse, 
  AuthConfig, 
  DEFAULT_AUTH_CONFIG 
} from './types'
import { authenticateUser, logoutUser } from './passwordAuth'
import { 
  getCurrentSessionUser, 
  isCurrentSessionValid, 
  setSessionCookie, 
  clearSession, 
  setupSessionMonitoring 
} from './session'

/**
 * Authentication Context
 * 
 * React context for managing authentication state across the application.
 * Provides centralized authentication state and actions.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider Props Interface
 * 
 * Configuration options for the AuthProvider component.
 */
export interface AuthProviderProps {
  children: ReactNode
  config?: Partial<AuthConfig>
  adminPassword?: string
  customUser?: Partial<AuthUser>
  enableSessionMonitoring?: boolean
  onAuthChange?: (user: AuthUser | null) => void
  onSessionExpired?: () => void
}

/**
 * MessMass AuthProvider Component
 * 
 * Provides authentication context to child components.
 * Handles session management, state persistence, and automatic session monitoring.
 * 
 * Features:
 * - Centralized authentication state management
 * - Automatic session validation and restoration
 * - Session expiration monitoring
 * - TypeScript support with full type safety
 * - Configurable authentication options
 * - Error handling and loading states
 * - SSR/SSG compatibility
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider 
 *       adminPassword="mySecretPassword"
 *       onAuthChange={(user) => console.log('Auth changed:', user)}
 *     >
 *       <MyAppContent />
 *     </AuthProvider>
 *   )
 * }
 * ```
 */
export function AuthProvider({
  children,
  config = {},
  adminPassword,
  customUser,
  enableSessionMonitoring = true,
  onAuthChange,
  onSessionExpired
}: AuthProviderProps) {
  
  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Update authentication state
   * 
   * Centralizes state updates and triggers callbacks.
   */
  const updateAuthState = useCallback((newUser: AuthUser | null, newError: string | null = null) => {
    setUser(newUser)
    setIsAuthenticated(!!newUser)
    setError(newError)
    
    // Trigger auth change callback
    if (onAuthChange) {
      onAuthChange(newUser)
    }
  }, [onAuthChange])

  /**
   * Initialize authentication state
   * 
   * Checks for existing session and restores authentication state.
   * Runs on component mount and handles SSR compatibility.
   */
  const initializeAuth = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        // Server-side: cannot check session, remain unauthenticated
        updateAuthState(null)
        return
      }
      
      // Check for existing valid session
      const sessionUser = getCurrentSessionUser(config, customUser)
      
      if (sessionUser) {
        updateAuthState(sessionUser)
      } else {
        updateAuthState(null)
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication'
      updateAuthState(null, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [config, customUser, updateAuthState])

  /**
   * Login function
   * 
   * Authenticates user with provided credentials and updates state.
   */
  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Attempt authentication
      const response = await authenticateUser(credentials, {
        adminPassword,
        enableBruteForceProtection: config.enableBruteForceProtection,
        bruteForceDelayMs: 1000,
        user: customUser
      })
      
      if (response.success && response.user && response.token) {
        // Set session cookie
        setSessionCookie(response.token, config)
        
        // Update authentication state
        updateAuthState(response.user)
        
        return response
      } else {
        // Authentication failed
        const errorMessage = response.error || response.message || 'Authentication failed'
        updateAuthState(null, errorMessage)
        
        return response
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed unexpectedly'
      updateAuthState(null, errorMessage)
      
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout function
   * 
   * Clears session and resets authentication state.
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      // Clear session
      clearSession(config)
      
      // Call logout handler (mostly for cleanup)
      logoutUser()
      
      // Update authentication state
      updateAuthState(null)
      
    } catch (err) {
      // Log error but still clear local state
      console.error('Logout error:', err)
      updateAuthState(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Check authentication status
   * 
   * Validates current session and updates state if needed.
   */
  const checkAuth = async (): Promise<void> => {
    try {
      const sessionUser = getCurrentSessionUser(config, customUser)
      
      if (sessionUser && user?.id !== sessionUser.id) {
        // Session exists and user changed
        updateAuthState(sessionUser)
      } else if (!sessionUser && user) {
        // Session expired but user still in state
        updateAuthState(null, 'Session expired')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication check failed'
      updateAuthState(null, errorMessage)
    }
  }

  /**
   * Clear error state
   * 
   * Resets error state to null.
   */
  const clearError = (): void => {
    setError(null)
  }

  /**
   * Handle session expiration
   * 
   * Called when session monitoring detects expired session.
   */
  const handleSessionExpired = useCallback(() => {
    updateAuthState(null, 'Session expired')
    
    if (onSessionExpired) {
      onSessionExpired()
    }
  }, [onSessionExpired, updateAuthState])

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Set up session monitoring
  useEffect(() => {
    if (!enableSessionMonitoring || typeof window === 'undefined') {
      return
    }
    
    const cleanup = setupSessionMonitoring(handleSessionExpired, config)
    
    // Cleanup on unmount
    return cleanup
  }, [enableSessionMonitoring, config, handleSessionExpired])

  // Create context value
  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    checkAuth,
    clearError
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 * 
 * React hook for accessing authentication context.
 * Provides type-safe access to authentication state and actions.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, isLoading } = useAuth()
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   if (!user) return <div>Not authenticated</div>
 *   
 *   return <div>Hello, {user.name}!</div>
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * useAuthUser Hook
 * 
 * Simplified hook that only returns the current user.
 * Useful when you only need user data without auth actions.
 * 
 * Usage:
 * ```tsx
 * function UserProfile() {
 *   const user = useAuthUser()
 *   return user ? <div>{user.name}</div> : <div>Not logged in</div>
 * }
 * ```
 */
export function useAuthUser(): AuthUser | null {
  const { user } = useAuth()
  return user
}

/**
 * useAuthActions Hook
 * 
 * Hook that only returns authentication actions.
 * Useful for login forms or components that trigger auth actions.
 * 
 * Usage:
 * ```tsx
 * function LoginButton() {
 *   const { login, logout, isLoading } = useAuthActions()
 *   // ... login logic
 * }
 * ```
 */
export function useAuthActions(): {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  isLoading: boolean
  error: string | null
} {
  const { login, logout, checkAuth, clearError, isLoading, error } = useAuth()
  
  return {
    login,
    logout,
    checkAuth,
    clearError,
    isLoading,
    error
  }
}

/**
 * AuthGuard Component
 * 
 * Higher-order component that protects routes/components from unauthenticated access.
 * Renders children only if user is authenticated, otherwise shows fallback.
 * 
 * Usage:
 * ```tsx
 * <AuthGuard fallback={<LoginPage />}>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ 
  children, 
  fallback,
  requirePermissions = [],
  requireRole
}: {
  children: ReactNode
  fallback?: ReactNode
  requirePermissions?: string[]
  requireRole?: string
}) {
  const { user, isLoading } = useAuth()
  
  // Skip loading state - show content immediately or fallback
  
  // Check authentication
  if (!user) {
    return fallback || (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        color: '#ef4444',
        fontSize: '1.1rem'
      }}>
        Authentication required
      </div>
    )
  }
  
  // Check role requirements
  if (requireRole && user.role !== requireRole) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        color: '#f59e0b',
        fontSize: '1.1rem'
      }}>
        Insufficient permissions (role: {requireRole})
      </div>
    )
  }
  
  // Check permission requirements
  if (requirePermissions.length > 0) {
    const hasAllPermissions = requirePermissions.every(permission => 
      user.permissions.includes(permission) || user.role === 'super-admin'
    )
    
    if (!hasAllPermissions) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: '#f59e0b',
          fontSize: '1.1rem'
        }}>
          Insufficient permissions
        </div>
      )
    }
  }
  
  // All checks passed, render children
  return <>{children}</>
}

/**
 * withAuth Higher-Order Component
 * 
 * HOC that injects authentication props into wrapped component.
 * Alternative to using the useAuth hook.
 * 
 * Usage:
 * ```tsx
 * const EnhancedComponent = withAuth(MyComponent)
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { auth: AuthContextType }>
) {
  return function WithAuthComponent(props: P) {
    const auth = useAuth()
    
    return <Component {...props} auth={auth} />
  }
}

/**
 * Default Exports
 * 
 * Provides convenient imports for common use cases.
 */
export default AuthProvider
