// lib/shareables/auth/types.ts
// TypeScript interfaces and types for MessMass Authentication System

/**
 * Authentication User Interface
 * 
 * Represents an authenticated user in the system.
 * This interface provides a standardized structure for user data
 * across the authentication system.
 */
export interface AuthUser {
  id: string                    // Unique user identifier
  name: string                  // Display name
  email: string                 // User email address
  role: UserRole               // User access level
  permissions: string[]         // Specific permissions array
  sessionToken?: string         // Optional session token
}

/**
 * User Role Enumeration
 * 
 * Defines the available user roles in the authentication system.
 * Roles determine access levels and available functionality.
 */
export type UserRole = 
  | 'admin'                    // Standard administrator
  | 'super-admin'             // Super administrator with full access
  | 'user'                    // Regular user (for future expansion)
  | 'viewer'                  // Read-only access (for future expansion)

/**
 * Authentication State Interface
 * 
 * Represents the current authentication state of the application.
 * Used by AuthProvider context to manage global auth state.
 */
export interface AuthState {
  user: AuthUser | null        // Currently authenticated user (null if not authenticated)
  isAuthenticated: boolean     // Boolean flag for quick auth checks
  isLoading: boolean          // Loading state during auth operations
  error: string | null        // Authentication error message
}

/**
 * Login Credentials Interface
 * 
 * Structure for login form data and authentication requests.
 * Currently supports password-based authentication.
 */
export interface LoginCredentials {
  password: string             // User password
}

/**
 * Login Response Interface
 * 
 * Structure for authentication API responses.
 * Includes success status, user data, and optional token.
 */
export interface LoginResponse {
  success: boolean             // Whether login was successful
  user?: AuthUser             // User data (if successful)
  token?: string              // Session token (if successful)
  message?: string            // Success or error message
  error?: string              // Error details (if failed)
}

/**
 * Session Token Data Interface
 * 
 * Structure for decoded session token data.
 * Used internally for session validation and management.
 */
export interface SessionTokenData {
  token: string               // Random session token
  expiresAt: string          // ISO 8601 expiration timestamp
  userId: string             // User ID associated with session
  role: UserRole             // User role for quick access checks
}

/**
 * Authentication Context Interface
 * 
 * Defines the structure of the authentication context.
 * Used by useAuth hook and AuthProvider.
 */
export interface AuthContextType {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

/**
 * Authentication Configuration Interface
 * 
 * Configuration options for the authentication system.
 * Allows customization of behavior and security settings.
 */
export interface AuthConfig {
  // API Endpoints
  loginEndpoint?: string       // Custom login API endpoint
  logoutEndpoint?: string      // Custom logout API endpoint
  checkAuthEndpoint?: string   // Custom auth check endpoint
  
  // Session Configuration
  sessionDuration?: number     // Session duration in milliseconds (default: 7 days)
  cookieName?: string         // Custom cookie name for session
  
  // Security Settings
  passwordMinLength?: number   // Minimum password length
  enableBruteForceProtection?: boolean // Enable login delay on failure
  
  // UI Configuration
  redirectAfterLogin?: string  // Redirect URL after successful login
  redirectAfterLogout?: string // Redirect URL after logout
}

/**
 * Authentication Hook Return Type
 * 
 * Type definition for the useAuth hook return value.
 * Ensures consistent typing across components using the hook.
 */
export type UseAuthReturn = AuthContextType

/**
 * Permission Check Function Type
 * 
 * Type definition for permission checking functions.
 * Used for role-based access control.
 */
export type PermissionChecker = (permission: string, user?: AuthUser) => boolean

/**
 * Default Authentication Configuration
 * 
 * Default values for authentication configuration.
 * Used when no custom config is provided.
 */
export const DEFAULT_AUTH_CONFIG: Required<AuthConfig> = {
  loginEndpoint: '/api/auth/login',
  logoutEndpoint: '/api/auth/logout',
  checkAuthEndpoint: '/api/auth/check',
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  cookieName: 'auth-session',
  passwordMinLength: 6,
  enableBruteForceProtection: true,
  redirectAfterLogin: '/',
  redirectAfterLogout: '/login'
}

/**
 * Common Permission Constants
 * 
 * Predefined permission strings for common operations.
 * Helps maintain consistency in permission naming.
 */
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE_USERS: 'manage-users',
  ADMIN_ACCESS: 'admin-access',
  SUPER_ADMIN: 'super-admin'
} as const

/**
 * Type guard to check if user has specific role
 * 
 * @param user - User to check
 * @param role - Role to check for
 * @returns boolean indicating if user has the role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role
}

/**
 * Type guard to check if user has specific permission
 * 
 * @param user - User to check
 * @param permission - Permission to check for
 * @returns boolean indicating if user has the permission
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false
  
  // Super admins have all permissions
  if (user.role === 'super-admin') return true
  
  // Check if user has specific permission
  return user.permissions.includes(permission)
}
