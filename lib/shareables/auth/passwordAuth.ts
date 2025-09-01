// lib/shareables/auth/passwordAuth.ts
// Password validation and authentication utilities for MessMass Auth System

import { AuthUser, LoginCredentials, LoginResponse, SessionTokenData, UserRole } from './types'

/**
 * Password Authentication Utilities
 * 
 * This module provides utilities for password-based authentication,
 * session token generation, and validation. It's extracted from the
 * MessMass implementation to be reusable in other projects.
 * 
 * Key Features:
 * - Simple password validation
 * - Session token generation with crypto-secure randomness
 * - Token validation with expiration checking
 * - Configurable admin user setup
 * - Brute force protection with delays
 */

/**
 * Default admin user configuration
 * 
 * This creates a simple admin user for demonstration purposes.
 * In production, this should be replaced with a proper user management system.
 */
const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'admin',
  name: 'Administrator',
  email: 'admin@example.com',
  role: 'super-admin',
  permissions: ['read', 'write', 'delete', 'manage-users', 'admin-access']
}

/**
 * Generate cryptographically secure session token
 * 
 * Creates a secure random token for session management.
 * Uses Node.js crypto module for secure random generation.
 * 
 * @param length - Token length in bytes (default: 32)
 * @returns Hexadecimal string token
 */
export function generateSessionToken(length: number = 32): string {
  // In browser environments, use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // In Node.js environments, use crypto module
  try {
    const crypto = require('crypto')
    return crypto.randomBytes(length).toString('hex')
  } catch (error) {
    // Fallback to Math.random (less secure, for development only)
    console.warn('Using fallback random generation. Not suitable for production!')
    return Array.from({ length: length * 2 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }
}

/**
 * Create session token data
 * 
 * Creates a structured token object with expiration and user information.
 * 
 * @param userId - User ID to associate with session
 * @param role - User role for quick access checks
 * @param durationMs - Session duration in milliseconds (default: 7 days)
 * @returns Complete session token data
 */
export function createSessionTokenData(
  userId: string, 
  role: UserRole, 
  durationMs: number = 7 * 24 * 60 * 60 * 1000
): SessionTokenData {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + durationMs).toISOString()
  
  return {
    token,
    expiresAt,
    userId,
    role
  }
}

/**
 * Encode session token for cookie storage
 * 
 * Encodes session data as a base64 string for secure cookie storage.
 * This is a simple encoding, not encryption. For production use,
 * consider using JWT or encrypted tokens.
 * 
 * @param tokenData - Session token data to encode
 * @returns Base64-encoded token string
 */
export function encodeSessionToken(tokenData: SessionTokenData): string {
  const jsonString = JSON.stringify(tokenData)
  
  // In browser environments, use btoa
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(jsonString)
  }
  
  // In Node.js environments, use Buffer
  return Buffer.from(jsonString).toString('base64')
}

/**
 * Decode session token from cookie
 * 
 * Decodes and parses session token from base64 cookie value.
 * 
 * @param encodedToken - Base64-encoded token string
 * @returns Decoded session token data or null if invalid
 */
export function decodeSessionToken(encodedToken: string): SessionTokenData | null {
  try {
    let jsonString: string
    
    // In browser environments, use atob
    if (typeof window !== 'undefined' && window.atob) {
      jsonString = window.atob(encodedToken)
    } else {
      // In Node.js environments, use Buffer
      jsonString = Buffer.from(encodedToken, 'base64').toString()
    }
    
    const tokenData = JSON.parse(jsonString) as SessionTokenData
    
    // Validate token data structure
    if (!tokenData.token || !tokenData.expiresAt || !tokenData.userId || !tokenData.role) {
      return null
    }
    
    return tokenData
  } catch (error) {
    return null
  }
}

/**
 * Validate session token
 * 
 * Checks if session token is valid and not expired.
 * 
 * @param encodedToken - Base64-encoded token string
 * @returns Boolean indicating token validity
 */
export function isValidSessionToken(encodedToken: string): boolean {
  const tokenData = decodeSessionToken(encodedToken)
  if (!tokenData) return false
  
  const now = new Date()
  const expiresAt = new Date(tokenData.expiresAt)
  
  return now <= expiresAt
}

/**
 * Validate password against admin password
 * 
 * Simple password validation for demo purposes.
 * In production, this should use proper password hashing (bcrypt, scrypt, etc.)
 * 
 * @param password - Password to validate
 * @param adminPassword - Expected admin password (from environment or config)
 * @returns Boolean indicating password validity
 */
export function validatePassword(password: string, adminPassword?: string): boolean {
  const expectedPassword = adminPassword || process.env.ADMIN_PASSWORD || 'admin123'
  return password === expectedPassword
}

/**
 * Perform login authentication
 * 
 * Main authentication function that validates credentials and creates session.
 * Includes configurable brute force protection.
 * 
 * @param credentials - Login credentials
 * @param config - Optional configuration for admin password and protection
 * @returns Promise resolving to login response
 */
export async function authenticateUser(
  credentials: LoginCredentials,
  config?: {
    adminPassword?: string
    enableBruteForceProtection?: boolean
    bruteForceDelayMs?: number
    user?: Partial<AuthUser>
  }
): Promise<LoginResponse> {
  const {
    adminPassword,
    enableBruteForceProtection = true,
    bruteForceDelayMs = 1000,
    user = DEFAULT_ADMIN_USER
  } = config || {}
  
  // Validate input
  if (!credentials.password) {
    return {
      success: false,
      error: 'Password is required',
      message: 'Please enter a password'
    }
  }
  
  // Validate password
  const isPasswordValid = validatePassword(credentials.password, adminPassword)
  
  if (!isPasswordValid) {
    // Add brute force protection delay
    if (enableBruteForceProtection) {
      await new Promise(resolve => setTimeout(resolve, bruteForceDelayMs))
    }
    
    return {
      success: false,
      error: 'Invalid password',
      message: 'The password you entered is incorrect'
    }
  }
  
  // Create session token
  const tokenData = createSessionTokenData(
    user.id || DEFAULT_ADMIN_USER.id,
    user.role || DEFAULT_ADMIN_USER.role
  )
  
  const sessionToken = encodeSessionToken(tokenData)
  
  // Create authenticated user object
  const authenticatedUser: AuthUser = {
    id: user.id || DEFAULT_ADMIN_USER.id,
    name: user.name || DEFAULT_ADMIN_USER.name,
    email: user.email || DEFAULT_ADMIN_USER.email,
    role: user.role || DEFAULT_ADMIN_USER.role,
    permissions: user.permissions || DEFAULT_ADMIN_USER.permissions,
    sessionToken
  }
  
  return {
    success: true,
    user: authenticatedUser,
    token: sessionToken,
    message: 'Login successful'
  }
}

/**
 * Get user from session token
 * 
 * Validates session token and returns associated user data.
 * 
 * @param sessionToken - Encoded session token
 * @param customUser - Optional custom user data
 * @returns User object or null if invalid/expired
 */
export function getUserFromSession(
  sessionToken: string, 
  customUser?: Partial<AuthUser>
): AuthUser | null {
  if (!isValidSessionToken(sessionToken)) {
    return null
  }
  
  const tokenData = decodeSessionToken(sessionToken)
  if (!tokenData) return null
  
  // Return user with session data
  const user = customUser || DEFAULT_ADMIN_USER
  return {
    id: user.id || tokenData.userId,
    name: user.name || DEFAULT_ADMIN_USER.name,
    email: user.email || DEFAULT_ADMIN_USER.email,
    role: tokenData.role,
    permissions: user.permissions || DEFAULT_ADMIN_USER.permissions,
    sessionToken
  }
}

/**
 * Check if user is authenticated
 * 
 * Quick helper to check authentication status from session token.
 * 
 * @param sessionToken - Encoded session token
 * @returns Boolean indicating authentication status
 */
export function isAuthenticated(sessionToken?: string): boolean {
  if (!sessionToken) return false
  return isValidSessionToken(sessionToken)
}

/**
 * Logout user (invalidate session)
 * 
 * In this simple implementation, logout is handled client-side by removing the token.
 * In production, you might want to maintain a server-side blacklist of invalidated tokens.
 * 
 * @returns Logout response
 */
export function logoutUser(): { success: boolean; message: string } {
  return {
    success: true,
    message: 'Logged out successfully'
  }
}

/**
 * Password strength validation
 * 
 * Validates password meets minimum security requirements.
 * Can be extended with more sophisticated rules.
 * 
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 6)
 * @returns Validation result with feedback
 */
export function validatePasswordStrength(
  password: string,
  minLength: number = 6
): { valid: boolean; feedback: string[] } {
  const feedback: string[] = []
  
  if (password.length < minLength) {
    feedback.push(`Password must be at least ${minLength} characters long`)
  }
  
  if (password.length === 0) {
    feedback.push('Password is required')
  }
  
  // Add more validation rules as needed
  // if (!/[A-Z]/.test(password)) {
  //   feedback.push('Password must contain at least one uppercase letter')
  // }
  
  return {
    valid: feedback.length === 0,
    feedback
  }
}
