// lib/csrf.ts
// WHAT: CSRF (Cross-Site Request Forgery) protection implementation
// WHY: Prevents malicious sites from making unauthorized requests on behalf of authenticated users
// HOW: Double-submit cookie pattern with cryptographically secure tokens

import { NextRequest, NextResponse } from 'next/server';

// WHAT: CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;           // 256 bits of entropy
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// WHAT: Generate cryptographically secure CSRF token
// WHY: Random token prevents attackers from guessing valid tokens
// HOW: Use Web Crypto API (Edge Runtime compatible)
export function generateCsrfToken(): string {
  // WHAT: Web Crypto API is available in Edge Runtime (unlike Node.js crypto)
  const buffer = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(buffer);
  
  // WHAT: Convert to hex string
  const token = Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return token;
}

// WHAT: Timing-safe string comparison
// WHY: Prevents timing attacks that could reveal token structure
// HOW: Constant-time comparison using XOR
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// WHAT: Get CSRF token from request (cookie or header)
// WHY: Supports both cookie-based and header-based CSRF patterns
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  // WHAT: First check X-CSRF-Token header (preferred for AJAX)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }
  
  // WHAT: Fall back to cookie (for form submissions)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

// WHAT: Validate CSRF token for state-changing requests
// WHY: Core CSRF protection - ensures request came from legitimate user action
// HOW: Double-submit cookie pattern - compare header token with cookie token
export function validateCsrfToken(request: NextRequest): boolean {
  // WHAT: Get token from request header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  // WHAT: Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  // WHAT: Both tokens must be present
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  // WHAT: Tokens must match (timing-safe comparison)
  try {
    return timingSafeEqual(headerToken, cookieToken);
  } catch {
    return false;
  }
}

// WHAT: CSRF protection middleware for state-changing requests
// WHY: Automatically protect POST/PUT/DELETE/PATCH endpoints
// HOW: Returns 403 Forbidden if token invalid or missing
export async function csrfProtectionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const method = request.method.toUpperCase();
  
  // WHAT: Only protect state-changing methods
  // WHY: GET/HEAD/OPTIONS are safe methods (by HTTP spec)
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null; // Allow through
  }
  
  // WHAT: Skip CSRF for authentication endpoints (chicken-and-egg problem)
  // WHY: Can't have token before authentication
  // NOTE: These endpoints are protected by rate limiting instead
  const authEndpoints = [
    '/api/admin/login',       // Admin authentication
    '/api/page-passwords',    // Page-specific password authentication (employees access)
  ];
  
  if (authEndpoints.includes(request.nextUrl.pathname)) {
    return null; // Allow through
  }
  
  // WHAT: Validate CSRF token
  const isValid = validateCsrfToken(request);
  
  if (!isValid) {
    // WHAT: Log CSRF violation for security monitoring
    console.warn('[CSRF] Token validation failed', {
      method: request.method,
      pathname: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
        message: 'Request rejected due to invalid CSRF token. Please refresh the page and try again.',
      },
      {
        status: 403,
        headers: {
          'X-CSRF-Protection': 'denied',
        },
      }
    );
  }
  
  return null; // Token valid, allow through
}

// WHAT: Set CSRF token cookie in response
// WHY: Client needs cookie to include in subsequent requests
// HOW: HttpOnly, SameSite=Lax for security
export function setCsrfTokenCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,          // Prevent JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',         // Prevent CSRF while allowing normal navigation
    maxAge: 60 * 60 * 24,    // 24 hours
    path: '/',               // Available to all paths
  });
  
  return response;
}

// WHAT: Generate and set new CSRF token
// WHY: Rotate tokens periodically for additional security
export function refreshCsrfToken(response: NextResponse): string {
  const newToken = generateCsrfToken();
  setCsrfTokenCookie(response, newToken);
  return newToken;
}

// WHAT: API endpoint to get CSRF token for client-side AJAX
// WHY: Client needs token to include in request headers
// HOW: Generate token, set cookie, return token in response body
export function getCsrfTokenEndpoint(): NextResponse {
  const token = generateCsrfToken();
  const response = NextResponse.json({
    csrfToken: token,
    expiresIn: 60 * 60 * 24, // 24 hours in seconds
  });
  
  setCsrfTokenCookie(response, token);
  
  return response;
}

// WHAT: Check if request requires CSRF protection
// WHY: Some endpoints (public reads) don't need CSRF
export function requiresCsrfProtection(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;
  
  // WHAT: Safe methods don't need CSRF
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return false;
  }
  
  // WHAT: Authentication endpoints handled separately
  const authEndpoints = ['/api/admin/login', '/api/page-passwords'];
  if (authEndpoints.includes(pathname)) {
    return false;
  }
  
  // WHAT: Public stats pages (if POST allowed) need CSRF
  // WHY: Prevent unauthorized stats submissions
  if (pathname.startsWith('/api/')) {
    return true;
  }
  
  return false;
}

// WHAT: Export constants for client-side usage
export const CSRF_CONSTANTS = {
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
  TOKEN_LENGTH: CSRF_TOKEN_LENGTH,
} as const;
