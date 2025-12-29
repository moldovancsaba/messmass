// lib/sessionTokens.ts
// WHAT: Session token utilities with dual-format support (Base64 legacy + JWT)
// WHY: Zero-downtime migration from unsigned Base64 tokens to cryptographically signed JWT
// HOW: Supports both formats during transition, validates based on format

import jwt from 'jsonwebtoken';
import { FEATURE_FLAGS } from './featureFlags';

/**
 * Session Token Data Structure
 * WHAT: Standardized token payload for both Base64 and JWT formats
 * WHY: Consistent data structure across token formats
 */
export interface SessionTokenData {
  token: string;           // Random token string (for legacy compatibility)
  expiresAt: string;       // ISO 8601 expiration timestamp
  userId: string;         // User ID (ObjectId string)
  role: 'guest' | 'user' | 'admin' | 'superadmin' | 'api';
}

/**
 * WHAT: Get JWT secret from environment
 * WHY: Centralized secret management
 * HOW: Falls back to generated secret if not set (development only)
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // Development fallback (NOT SECURE - for local dev only)
    console.warn('⚠️  JWT_SECRET not set - using insecure fallback (development only)');
    return 'dev-secret-change-in-production';
  }
  return secret;
}

/**
 * WHAT: Generate JWT session token
 * WHY: Cryptographically signed tokens prevent tampering
 * HOW: Uses HS256 algorithm with expiration
 */
export function generateJWTSessionToken(tokenData: SessionTokenData): string {
  const secret = getJWTSecret();
  
  // WHAT: JWT payload (tokenData without token field - JWT handles signing)
  // WHY: Cleaner payload, JWT signature provides security
  const payload = {
    userId: tokenData.userId,
    role: tokenData.role,
    expiresAt: tokenData.expiresAt,
    // Include random token for legacy compatibility tracking
    token: tokenData.token,
  };
  
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

/**
 * WHAT: Validate and decode JWT session token
 * WHY: Verify token signature and extract payload
 * HOW: Uses jwt.verify() which validates signature and expiration
 */
export function validateJWTSessionToken(jwtToken: string): SessionTokenData | null {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(jwtToken, secret, {
      algorithms: ['HS256'],
    }) as any;
    
    // WHAT: Reconstruct SessionTokenData from JWT payload
    // WHY: Maintain consistent interface across token formats
    return {
      token: decoded.token || '',
      expiresAt: decoded.expiresAt || decoded.exp,
      userId: decoded.userId || decoded.sub || '',
      role: decoded.role || 'guest',
    };
  } catch (error) {
    // WHAT: JWT verification failed (invalid signature, expired, malformed)
    // WHY: Return null to indicate invalid token
    return null;
  }
}

/**
 * WHAT: Generate legacy Base64 session token
 * WHY: Backward compatibility during migration
 * HOW: Simple Base64 encoding (NOT secure - for migration only)
 */
export function generateLegacySessionToken(tokenData: SessionTokenData): string {
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * WHAT: Validate and decode legacy Base64 session token
 * WHY: Support existing sessions during migration
 * HOW: Decodes Base64 and validates expiration manually
 */
export function validateLegacySessionToken(legacyToken: string): SessionTokenData | null {
  try {
    const json = Buffer.from(legacyToken, 'base64').toString();
    const tokenData = JSON.parse(json) as SessionTokenData;
    
    // WHAT: Validate token structure
    // WHY: Ensure all required fields are present
    if (!tokenData.token || !tokenData.expiresAt || !tokenData.userId || !tokenData.role) {
      return null;
    }
    
    // WHAT: Validate expiration manually (legacy tokens don't auto-expire)
    // WHY: Prevent use of expired tokens
    const expiresAt = new Date(tokenData.expiresAt);
    const now = new Date();
    if (now > expiresAt) {
      return null; // Expired
    }
    
    return tokenData;
  } catch (error) {
    // WHAT: Decoding failed (invalid Base64, malformed JSON)
    // WHY: Return null to indicate invalid token
    return null;
  }
}

/**
 * WHAT: Detect token format (JWT or legacy Base64)
 * WHY: Route to appropriate validation function
 * HOW: JWT tokens contain dots (header.payload.signature), Base64 doesn't
 */
export function detectTokenFormat(token: string): 'jwt' | 'legacy' {
  // WHAT: JWT tokens have 3 parts separated by dots
  // WHY: Simple heuristic to distinguish formats
  const parts = token.split('.');
  if (parts.length === 3) {
    return 'jwt';
  }
  return 'legacy';
}

/**
 * WHAT: Validate session token (supports both formats)
 * WHY: Unified validation interface for dual-token migration
 * HOW: Auto-detects format and routes to appropriate validator
 */
export function validateSessionToken(token: string, format?: 'jwt' | 'legacy'): SessionTokenData | null {
  // WHAT: Use provided format or auto-detect
  // WHY: Support explicit format hint or automatic detection
  const detectedFormat = format || detectTokenFormat(token);
  
  if (detectedFormat === 'jwt') {
    return validateJWTSessionToken(token);
  } else {
    return validateLegacySessionToken(token);
  }
}

/**
 * WHAT: Generate session token (supports both formats via feature flag)
 * WHY: Zero-downtime migration - generate format based on feature flag
 * HOW: Uses feature flag to determine which format to generate
 */
export function generateSessionToken(tokenData: SessionTokenData): string {
  if (FEATURE_FLAGS.USE_JWT_SESSIONS) {
    return generateJWTSessionToken(tokenData);
  } else {
    return generateLegacySessionToken(tokenData);
  }
}

