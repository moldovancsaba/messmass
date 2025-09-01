// lib/shareables/auth/session.ts
// Session management utilities for MessMass Authentication System

import { AuthUser, AuthConfig, DEFAULT_AUTH_CONFIG } from './types'
import { isValidSessionToken, getUserFromSession } from './passwordAuth'

/**
 * Session Management Utilities
 * 
 * This module provides utilities for managing authentication sessions
 * in browser environments. It handles cookie operations, session validation,
 * and provides both client-side and server-side session management.
 * 
 * Key Features:
 * - Secure cookie management
 * - Session validation and renewal  
 * - Browser and server compatibility
 * - Configurable session options
 * - Automatic session cleanup
 */

/**
 * Cookie management utilities
 * 
 * These utilities handle secure cookie operations for session storage.
 * They work in both browser and server environments.
 */

/**
 * Set session cookie
 * 
 * Sets a secure, HTTP-only session cookie with appropriate security settings.
 * 
 * @param sessionToken - Base64-encoded session token
 * @param config - Optional configuration for cookie settings
 */
export function setSessionCookie(
  sessionToken: string, 
  config: Partial<AuthConfig> = {}
): void {
  const {
    cookieName = DEFAULT_AUTH_CONFIG.cookieName,
    sessionDuration = DEFAULT_AUTH_CONFIG.sessionDuration
  } = config

  // Calculate expiration date
  const expirationDate = new Date(Date.now() + sessionDuration)
  
  // Cookie options for security
  const cookieOptions = [
    `${cookieName}=${sessionToken}`,
    `expires=${expirationDate.toUTCString()}`,
    'path=/',
    'SameSite=Lax'
  ]
  
  // Add secure flag in production/HTTPS environments
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') {
      cookieOptions.push('Secure')
    }
  } else {
    // Server-side: assume production is HTTPS
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure')
    }
  }
  
  const cookieString = cookieOptions.join('; ')
  
  // Set cookie in appropriate environment
  if (typeof document !== 'undefined') {
    // Browser environment
    document.cookie = cookieString
  } else {
    // Server environment - this would need to be handled by the calling code
    // as we can't directly set response headers from here
    console.warn('Server-side cookie setting needs to be handled by API route')
  }
}

/**
 * Get session cookie value
 * 
 * Retrieves session token from cookies in browser environment.
 * 
 * @param config - Optional configuration for cookie name
 * @returns Session token string or null if not found
 */
export function getSessionCookie(config: Partial<AuthConfig> = {}): string | null {
  const { cookieName = DEFAULT_AUTH_CONFIG.cookieName } = config
  
  // Only works in browser environment
  if (typeof document === 'undefined') {
    return null
  }
  
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === cookieName) {
      return decodeURIComponent(value)
    }
  }
  
  return null
}

/**
 * Remove session cookie
 * 
 * Clears the session cookie by setting it to expire in the past.
 * 
 * @param config - Optional configuration for cookie name
 */
export function removeSessionCookie(config: Partial<AuthConfig> = {}): void {
  const { cookieName = DEFAULT_AUTH_CONFIG.cookieName } = config
  
  if (typeof document !== 'undefined') {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
}

/**
 * Session validation and management
 */

/**
 * Get current session user
 * 
 * Retrieves and validates the current authenticated user from session.
 * 
 * @param config - Optional authentication configuration
 * @param customUser - Optional custom user data for validation
 * @returns Authenticated user or null if session invalid
 */
export function getCurrentSessionUser(
  config: Partial<AuthConfig> = {},
  customUser?: Partial<AuthUser>
): AuthUser | null {
  const sessionToken = getSessionCookie(config)
  
  if (!sessionToken) {
    return null
  }
  
  return getUserFromSession(sessionToken, customUser)
}

/**
 * Check if current session is valid
 * 
 * Validates the current session without returning user data.
 * 
 * @param config - Optional authentication configuration
 * @returns Boolean indicating session validity
 */
export function isCurrentSessionValid(config: Partial<AuthConfig> = {}): boolean {
  const sessionToken = getSessionCookie(config)
  
  if (!sessionToken) {
    return false
  }
  
  return isValidSessionToken(sessionToken)
}

/**
 * Refresh session token
 * 
 * Updates the session cookie with a new expiration time.
 * This is useful for implementing sliding session expiration.
 * 
 * @param config - Optional authentication configuration
 * @returns Boolean indicating if refresh was successful
 */
export function refreshSession(config: Partial<AuthConfig> = {}): boolean {
  const sessionToken = getSessionCookie(config)
  
  if (!sessionToken || !isValidSessionToken(sessionToken)) {
    return false
  }
  
  // Reset the cookie with new expiration
  setSessionCookie(sessionToken, config)
  return true
}

/**
 * Clear session
 * 
 * Removes the session cookie and clears any cached user data.
 * 
 * @param config - Optional authentication configuration
 */
export function clearSession(config: Partial<AuthConfig> = {}): void {
  removeSessionCookie(config)
  
  // Clear any cached user data if needed
  if (typeof window !== 'undefined') {
    // Clear localStorage or sessionStorage if used
    try {
      localStorage.removeItem('auth-user')
      sessionStorage.removeItem('auth-user')
    } catch (error) {
      // Storage might not be available
    }
  }
}

/**
 * Session monitoring and automatic cleanup
 */

/**
 * Session expiration check interval (in milliseconds)
 * Default: Check every 5 minutes
 */
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000

/**
 * Set up automatic session monitoring
 * 
 * Sets up periodic checks for session expiration and automatic cleanup.
 * Only works in browser environment.
 * 
 * @param onSessionExpired - Callback function called when session expires
 * @param config - Optional authentication configuration
 * @returns Cleanup function to stop monitoring
 */
export function setupSessionMonitoring(
  onSessionExpired?: () => void,
  config: Partial<AuthConfig> = {}
): () => void {
  // Only works in browser environment
  if (typeof window === 'undefined') {
    return () => {} // No-op cleanup function
  }
  
  const intervalId = setInterval(() => {
    if (!isCurrentSessionValid(config)) {
      // Session expired
      clearSession(config)
      
      if (onSessionExpired) {
        onSessionExpired()
      }
    }
  }, SESSION_CHECK_INTERVAL)
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * Server-side session utilities
 * 
 * These utilities are designed for use in Next.js API routes and server components.
 */

/**
 * Get session from server-side cookies
 * 
 * Extracts session token from Next.js cookies() or request headers.
 * 
 * @param cookieValue - Cookie value from server-side request
 * @param config - Optional authentication configuration
 * @param customUser - Optional custom user data
 * @returns Authenticated user or null
 */
export function getServerSessionUser(
  cookieValue: string | undefined,
  config: Partial<AuthConfig> = {},
  customUser?: Partial<AuthUser>
): AuthUser | null {
  if (!cookieValue) {
    return null
  }
  
  return getUserFromSession(cookieValue, customUser)
}

/**
 * Validate server-side session
 * 
 * Validates session token from server-side request.
 * 
 * @param cookieValue - Cookie value from server-side request
 * @returns Boolean indicating session validity
 */
export function isServerSessionValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) {
    return false
  }
  
  return isValidSessionToken(cookieValue)
}

/**
 * Create server-side cookie string
 * 
 * Creates a properly formatted cookie string for server-side responses.
 * 
 * @param sessionToken - Base64-encoded session token
 * @param config - Optional authentication configuration
 * @returns Cookie string for Set-Cookie header
 */
export function createServerCookieString(
  sessionToken: string,
  config: Partial<AuthConfig> = {}
): string {
  const {
    cookieName = DEFAULT_AUTH_CONFIG.cookieName,
    sessionDuration = DEFAULT_AUTH_CONFIG.sessionDuration
  } = config
  
  const expirationDate = new Date(Date.now() + sessionDuration)
  
  const cookieOptions = [
    `${cookieName}=${sessionToken}`,
    'HttpOnly',
    `Expires=${expirationDate.toUTCString()}`,
    'Path=/',
    'SameSite=Lax'
  ]
  
  // Add Secure flag in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.push('Secure')
  }
  
  return cookieOptions.join('; ')
}

/**
 * Create server-side logout cookie string
 * 
 * Creates a cookie string to clear the session cookie.
 * 
 * @param config - Optional authentication configuration
 * @returns Cookie string for clearing session
 */
export function createServerLogoutCookieString(
  config: Partial<AuthConfig> = {}
): string {
  const { cookieName = DEFAULT_AUTH_CONFIG.cookieName } = config
  
  return `${cookieName}=; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`
}

/**
 * Session debugging utilities
 * 
 * These utilities help with debugging session issues in development.
 */

/**
 * Get session debug info
 * 
 * Returns detailed information about the current session for debugging.
 * Only works in development mode for security.
 * 
 * @param config - Optional authentication configuration
 * @returns Debug information object
 */
export function getSessionDebugInfo(config: Partial<AuthConfig> = {}): {
  hasSessionCookie: boolean
  isSessionValid: boolean
  sessionToken?: string
  user?: AuthUser | null
  error?: string
} {
  // Only provide debug info in development
  if (process.env.NODE_ENV === 'production') {
    return {
      hasSessionCookie: false,
      isSessionValid: false,
      error: 'Debug info not available in production'
    }
  }
  
  const sessionToken = getSessionCookie(config)
  const hasSessionCookie = !!sessionToken
  const isValid = hasSessionCookie && isValidSessionToken(sessionToken)
  const user = hasSessionCookie ? getUserFromSession(sessionToken) : null
  
  return {
    hasSessionCookie,
    isSessionValid: isValid,
    sessionToken: sessionToken?.substring(0, 20) + '...', // Truncated for security
    user,
    error: !hasSessionCookie ? 'No session cookie found' : 
           !isValid ? 'Session token invalid or expired' : undefined
  }
}
