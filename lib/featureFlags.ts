// lib/featureFlags.ts
// WHAT: Feature flag system for zero-downtime migrations and gradual rollouts
// WHY: Enable instant rollback capability and phased feature deployment
// HOW: Environment-based flags with runtime checks

/**
 * Feature Flags Configuration
 * 
 * WHAT: Centralized feature flag management for security migrations
 * WHY: Allows instant rollback via environment variable changes without code deployment
 * HOW: Flags are checked at runtime, can be toggled via Vercel environment variables
 * 
 * USAGE:
 *   import { FEATURE_FLAGS } from '@/lib/featureFlags';
 *   if (FEATURE_FLAGS.USE_BCRYPT_AUTH) {
 *     // New secure implementation
 *   } else {
 *     // Legacy implementation
 *   }
 */

export const FEATURE_FLAGS = {
  /**
   * WHAT: Enable bcrypt password hashing for authentication
   * WHY: Migrate from plaintext passwords to secure hashing
   * DEFAULT: false (legacy plaintext until migration complete)
   * ROLLBACK: Set ENABLE_BCRYPT_AUTH=false in Vercel
   */
  USE_BCRYPT_AUTH: process.env.ENABLE_BCRYPT_AUTH === 'true',

  /**
   * WHAT: Enable JWT session tokens instead of Base64
   * WHY: Migrate from unsigned tokens to cryptographically signed tokens
   * DEFAULT: false (legacy Base64 until migration complete)
   * ROLLBACK: Set ENABLE_JWT_SESSIONS=false in Vercel
   */
  USE_JWT_SESSIONS: process.env.ENABLE_JWT_SESSIONS === 'true',

  /**
   * WHAT: Enable HTML sanitization for XSS protection
   * WHY: Prevent XSS attacks via dangerouslySetInnerHTML
   * DEFAULT: false (no sanitization until migration complete)
   * ROLLBACK: Set ENABLE_HTML_SANITIZATION=false in Vercel
   */
  USE_SANITIZED_HTML: process.env.ENABLE_HTML_SANITIZATION === 'true',

  /**
   * WHAT: Enable safe formula parser instead of Function() constructor
   * WHY: Prevent code injection via formula evaluation
   * DEFAULT: false (legacy Function() until migration complete)
   * ROLLBACK: Set ENABLE_SAFE_FORMULA_PARSER=false in Vercel
   */
  USE_SAFE_FORMULA_PARSER: process.env.ENABLE_SAFE_FORMULA_PARSER === 'true',
} as const;

/**
 * WHAT: Get feature flag status for logging/monitoring
 * WHY: Track which features are enabled in production
 */
export function getFeatureFlagStatus(): Record<string, boolean> {
  return {
    USE_BCRYPT_AUTH: FEATURE_FLAGS.USE_BCRYPT_AUTH,
    USE_JWT_SESSIONS: FEATURE_FLAGS.USE_JWT_SESSIONS,
    USE_SANITIZED_HTML: FEATURE_FLAGS.USE_SANITIZED_HTML,
    USE_SAFE_FORMULA_PARSER: FEATURE_FLAGS.USE_SAFE_FORMULA_PARSER,
  };
}

/**
 * WHAT: Validate required security feature flags in production
 * WHY: Fail fast if security features are disabled in production (P0 security requirement)
 * HOW: Checks NODE_ENV and required flags, throws with clear error message if validation fails
 * 
 * @throws Error if production environment and required flags are not enabled
 */
export function validateSecurityFeatureFlags(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // WHAT: Detect if we're in Next.js build/prerender phase
  // WHY: Next.js tries to validate during static generation - skip gracefully
  // HOW: Check for webpack/build indicators and lack of server runtime
  const isBuildPhase = typeof window === 'undefined' && 
                      (process.env.__NEXT_PRIVATE_PREBUNDLED_REACT === 'next' ||
                       process.env.NEXT_PHASE === 'phase-production-build');

  // Skip validation during build phase or non-production
  if (!isProduction || isBuildPhase) {
    return;
  }

  const requiredFlags = [
    { envVar: 'ENABLE_BCRYPT_AUTH', flag: FEATURE_FLAGS.USE_BCRYPT_AUTH, name: 'Password Security (bcrypt)' },
    { envVar: 'ENABLE_JWT_SESSIONS', flag: FEATURE_FLAGS.USE_JWT_SESSIONS, name: 'Session Security (JWT)' },
    { envVar: 'ENABLE_HTML_SANITIZATION', flag: FEATURE_FLAGS.USE_SANITIZED_HTML, name: 'XSS Protection (HTML sanitization)' },
  ] as const;

  const missingFlags: Array<{ envVar: string; name: string }> = [];
  for (const { envVar, flag, name } of requiredFlags) {
    if (!flag) {
      missingFlags.push({ envVar, name });
    }
  }

  if (missingFlags.length > 0) {
    const errorMessage = [
      '❌ CRITICAL SECURITY ERROR: Required security feature flags are not enabled in production.',
      '',
      'Missing flags:',
      ...missingFlags.map(({ name, envVar }) => `  - ${name} (${envVar})`),
      '',
      'Remediation:',
      '1. Set the following environment variables in your production environment (Vercel/your hosting):',
      ...missingFlags.map(({ envVar }) => `   ${envVar}=true`),
      '',
      '2. Redeploy the application',
      '',
      '3. Verify flags are enabled:',
      '   - Check Vercel environment variables',
      '   - Verify application starts without this error',
      '',
      'This is a P0 security requirement. The application will not start until all required flags are enabled.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

