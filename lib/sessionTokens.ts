// lib/sessionTokens.ts
// WHAT: Signed session token mint/validate. JWT (HS256) only.
// WHY: This module previously accepted an unsigned Base64 "legacy" format, and
//     accepted it *unconditionally* — the USE_JWT_SESSIONS flag gated only
//     generation, never validation. A session cookie is a bearer credential, so an
//     unsigned one is forgeable: audit F-002 verified that a hand-built Base64
//     blob was accepted with an arbitrary userId, and that a session holder could
//     extend their own expiry indefinitely by editing the cookie.
// HOW: One format, always verified. The legacy mint/validate functions are gone
//     rather than deprecated, so the format cannot be reintroduced by flipping a
//     flag. Verified safe to remove before shipping: production has JWT_SECRET
//     (66 chars) and ENABLE_JWT_SESSIONS=true, so live sessions are already
//     signed and no user is logged out by this change.

import jwt from 'jsonwebtoken';
import { type UserRole, USER_ROLES } from './users';

/**
 * Session Token Data Structure
 * WHAT: Standardized token payload for both Base64 and JWT formats
 * WHY: Consistent data structure across token formats
 */
export interface SessionTokenData {
  token: string;           // Random token string (for legacy compatibility)
  expiresAt: string;       // ISO 8601 expiration timestamp
  userId: string;         // User ID (ObjectId string)
  role: UserRole;
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
  // WHAT: Validate secret length in production (v11.46.1+)
  // WHY: Prevent weak secrets from being accepted
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for production security');
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
    const role = decoded.role as UserRole | undefined;
    return {
      token: decoded.token || '',
      expiresAt: decoded.expiresAt || decoded.exp,
      userId: decoded.userId || decoded.sub || '',
      role: role && USER_ROLES.includes(role) ? role : 'guest',
    };
  } catch (error) {
    // WHAT: JWT verification failed (invalid signature, expired, malformed)
    // WHY: Return null to indicate invalid token
    return null;
  }
}

/**
 * WHAT: Validate a session token. Signature is always verified.
 * WHY: The `format` parameter is retained only so existing callers keep compiling;
 *     it is deliberately ignored. It used to be sourced from the `session-format`
 *     cookie, which is not HttpOnly and therefore client-writable — letting the
 *     caller of a security check choose which check runs is the bug, not a feature.
 */
export function validateSessionToken(token: string, _format?: 'jwt' | 'legacy'): SessionTokenData | null {
  return validateJWTSessionToken(token);
}

/**
 * WHAT: Generate a session token.
 * WHY: No format branch. If generation could fall back to an unsigned format while
 *     validation requires a signature, flipping a flag would lock every user out —
 *     so the two must not be independently switchable.
 */
export function generateSessionToken(tokenData: SessionTokenData): string {
  return generateJWTSessionToken(tokenData);
}

