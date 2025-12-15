// lib/apiAuth.ts
// WHAT: Bearer token authentication for public API endpoints
// WHY: Enable third-party integrations with user-based API keys and accountability
// HOW: Validate Authorization: Bearer tokens against users collection; track usage

import { NextRequest, NextResponse } from 'next/server';
import type { AdminUser } from './auth';
import { findUserByPassword, updateAPIUsage } from './users';
import { debug, warn, error as logError } from './logger';

/**
 * APIAuthResult
 * WHAT: Result of API key validation
 * WHY: Consistent return type for validation logic
 */
export interface APIAuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  errorCode?: string;
}

/**
 * parseAuthorizationHeader
 * WHAT: Extract Bearer token from Authorization header
 * WHY: Standard HTTP authentication mechanism
 * 
 * @param request - Next.js request object
 * @returns Bearer token string or null if missing/malformed
 */
export function parseAuthorizationHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  // WHAT: Check for Authorization header
  // WHY: Bearer tokens are sent via this standard header
  if (!authHeader) {
    return null;
  }
  
  // WHAT: Verify Bearer scheme
  // WHY: Only support Bearer tokens (not Basic, Digest, etc.)
  if (!authHeader.startsWith('Bearer ')) {
    debug('Invalid authorization scheme', { authHeader: authHeader.substring(0, 20) });
    return null;
  }
  
  // WHAT: Extract token after "Bearer "
  // WHY: Token is everything after the scheme prefix
  const token = authHeader.substring(7).trim();
  
  if (!token) {
    return null;
  }
  
  return token;
}

/**
 * validateAPIKey
 * WHAT: Validate Bearer token and return authenticated user
 * WHY: Core authentication logic for public API endpoints
 * 
 * SECURITY:
 *   - Token is user's password (temporary v1 design; see users.ts for roadmap)
 *   - Only users with apiKeyEnabled=true can authenticate
 *   - Usage tracking incremented on successful auth
 *   - All attempts logged with redacted tokens (last 4 chars only)
 * 
 * @param token - Bearer token from Authorization header
 * @returns APIAuthResult with user data or error details
 */
export async function validateAPIKey(token: string): Promise<APIAuthResult> {
  // WHAT: Redact token for logging (show last 4 chars only)
  // WHY: Audit trail without exposing full credentials
  const redacted = token.length > 4 ? `****${token.slice(-4)}` : '****';
  
  try {
    // WHAT: Find user by password (password = API key in v1)
    // WHY: Reuse existing user authentication without new schema
    // NOTE: See lib/users.ts findUserByPassword() for security considerations
    const user = await findUserByPassword(token);
    
    if (!user) {
      warn('API auth failed: invalid token', { token: redacted });
      return {
        success: false,
        error: 'Invalid API key',
        errorCode: 'INVALID_TOKEN'
      };
    }
    
    // WHAT: Check if API access is enabled for this user
    // WHY: Admin control - user exists but API access may be disabled
    if (!user.apiKeyEnabled) {
      warn('API auth failed: API access disabled', { 
        userId: user._id?.toString(),
        email: user.email,
        token: redacted 
      });
      return {
        success: false,
        error: 'API access not enabled for this user',
        errorCode: 'API_ACCESS_DISABLED'
      };
    }
    
    // WHAT: Update usage tracking (async, don't block response)
    // WHY: Track API calls for audit trail and usage analytics
    updateAPIUsage(user._id!.toString()).catch(err => {
      logError('Failed to update API usage', {
        userId: user._id?.toString(),
        error: err
      });
    });
    
    debug('API auth successful', {
      userId: user._id?.toString(),
      email: user.email,
      role: user.role,
      token: redacted
    });
    
    // WHAT: Return sanitized user object
    // WHY: Match AdminUser interface from lib/auth.ts
    return {
      success: true,
      user: {
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'super-admin',
        permissions: ['read'] // API users are read-only in v1
      }
    };
    
  } catch (err) {
    logError('API auth error', {
      token: redacted,
      error: err
    });
    return {
      success: false,
      error: 'Authentication error',
      errorCode: 'AUTH_ERROR'
    };
  }
}

/**
 * requireAPIAuth
 * WHAT: Middleware to protect API endpoints with Bearer token authentication
 * WHY: Reusable authentication layer for all public API routes
 * 
 * USAGE:
 *   export async function GET(request: NextRequest) {
 *     const authResult = await requireAPIAuth(request);
 *     if (!authResult.success) {
 *       return authResult.response;
 *     }
 *     // authResult.user contains authenticated user
 *     const data = await getProtectedData();
 *     return NextResponse.json({ success: true, data });
 *   }
 * 
 * @param request - Next.js request object
 * @returns { success, user, response } - If success=false, return the response
 */
export async function requireAPIAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: AdminUser;
  response?: NextResponse;
}> {
  // WHAT: Reject requests with Cookie headers
  // WHY: Public API must use Bearer tokens only (never session cookies)
  const hasCookies = request.headers.get('cookie');
  if (hasCookies) {
    warn('API request rejected: cookies not allowed', {
      pathname: request.nextUrl.pathname
    });
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'API authentication requires Bearer token, cookies are not supported',
          errorCode: 'COOKIES_NOT_ALLOWED'
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="MessMass API"',
            'Vary': 'Authorization'
          }
        }
      )
    };
  }
  
  // WHAT: Extract Bearer token from Authorization header
  const token = parseAuthorizationHeader(request);
  
  if (!token) {
    warn('API auth failed: missing token', {
      pathname: request.nextUrl.pathname
    });
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Authorization header required. Format: Bearer <api-key>',
          errorCode: 'MISSING_TOKEN'
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="MessMass API"'
          }
        }
      )
    };
  }
  
  // WHAT: Validate token and get user
  const authResult = await validateAPIKey(token);
  
  if (!authResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: authResult.error,
          errorCode: authResult.errorCode
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="MessMass API", error="invalid_token"'
          }
        }
      )
    };
  }
  
  // WHAT: Return successful authentication with user data
  return {
    success: true,
    user: authResult.user
  };
}

/**
 * getUserIdForRateLimit
 * WHAT: Extract user ID for rate limiting (IP fallback)
 * WHY: User-based rate limits for authenticated requests, IP for anonymous
 * 
 * @param request - Next.js request object
 * @returns userId string or IP address
 */
export async function getUserIdForRateLimit(request: NextRequest): Promise<string> {
  const token = parseAuthorizationHeader(request);
  
  if (!token) {
    // WHAT: Use IP address for anonymous requests
    // WHY: Rate limit by IP when no authentication
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || request.headers.get('x-real-ip')
      || 'unknown';
  }
  
  // WHAT: Validate token to get user ID
  const authResult = await validateAPIKey(token);
  
  if (authResult.success && authResult.user) {
    // WHAT: Use user ID for authenticated requests
    // WHY: Fair usage across multiple IPs (distributed systems)
    return `user:${authResult.user.id}`;
  }
  
  // WHAT: Fallback to IP for invalid tokens
  // WHY: Still enforce rate limits even for failed auth attempts
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || request.headers.get('x-real-ip')
    || 'unknown';
}

/**
 * requireAPIWriteAuth
 * WHAT: Middleware to protect write endpoints with Bearer token + write permission check
 * WHY: Separate write permissions from read for defense in depth (Fanmass integration)
 * 
 * SECURITY: Requires BOTH apiKeyEnabled=true AND apiWriteEnabled=true
 * 
 * USAGE:
 *   export async function POST(request: NextRequest) {
 *     const authResult = await requireAPIWriteAuth(request);
 *     if (!authResult.success) {
 *       return authResult.response;
 *     }
 *     // authResult.user contains authenticated user with write permissions
 *     await injectStatsData(eventId, stats);
 *     return NextResponse.json({ success: true });
 *   }
 * 
 * @param request - Next.js request object
 * @returns { success, user, response } - If success=false, return the response
 */
export async function requireAPIWriteAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: AdminUser;
  response?: NextResponse;
}> {
  // WHAT: First perform standard API authentication
  // WHY: Validate Bearer token and check apiKeyEnabled flag
  const authResult = await requireAPIAuth(request);
  
  if (!authResult.success) {
    // Authentication failed - return the error response from requireAPIAuth
    return authResult;
  }
  
  // WHAT: Check if user has write permissions enabled
  // WHY: Write access is separate from read access for security
  const { findUserById } = await import('./users');
  const user = await findUserById(authResult.user!.id);
  
  if (!user?.apiWriteEnabled) {
    warn('API write auth failed: write access disabled', {
      userId: authResult.user!.id,
      email: authResult.user!.email,
      pathname: request.nextUrl.pathname
    });
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Write access not enabled for this API user. Contact administrator to enable write permissions.',
          errorCode: 'WRITE_ACCESS_DISABLED'
        },
        {
          status: 403,
          headers: {
            'WWW-Authenticate': 'Bearer realm="MessMass API", error="insufficient_scope"'
          }
        }
      )
    };
  }
  
  // WHAT: Update write usage tracking (async, don't block response)
  // WHY: Track write operations separately from read operations
  const { updateAPIWriteUsage } = await import('./users');
  updateAPIWriteUsage(user._id!.toString()).catch(err => {
    logError('Failed to update API write usage', {
      userId: user._id?.toString(),
      error: err
    });
  });
  
  debug('API write auth successful', {
    userId: authResult.user!.id,
    email: authResult.user!.email,
    pathname: request.nextUrl.pathname
  });
  
  // WHAT: Return successful authentication with user data
  return {
    success: true,
    user: authResult.user
  };
}
