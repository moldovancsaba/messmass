// middleware.ts
// WHAT: Next.js middleware for security and monitoring
// WHY: Centralized security enforcement before requests reach API handlers
// HOW: Rate limiting → CSRF protection → Logging → Continue to handler

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitConfig } from '@/lib/rateLimit';
import { csrfProtectionMiddleware, setCsrfTokenCookie, generateCsrfToken } from '@/lib/csrf';
import { logRequestEnd, logRateLimitExceeded, logCsrfViolation } from '@/lib/logger';

// WHAT: Main middleware function (runs on every request)
// WHY: Apply security controls before request reaches route handlers
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // WHAT: 1. Apply rate limiting
  // WHY: Prevent DDoS and brute-force attacks
  const rateLimitResponse = await rateLimitMiddleware(
    request,
    getRateLimitConfig(request)
  );
  
  if (rateLimitResponse) {
    // WHAT: Rate limit exceeded - log and return 429
    logRateLimitExceeded(
      request.headers.get('x-forwarded-for') || 'unknown',
      request.nextUrl.pathname,
      getRateLimitConfig(request).maxRequests
    );
    
    return rateLimitResponse;
  }
  
  // WHAT: 2. Apply CSRF protection (for state-changing methods)
  // WHY: Prevent cross-site request forgery attacks
  const csrfResponse = await csrfProtectionMiddleware(request);
  
  if (csrfResponse) {
    // WHAT: CSRF violation - log and return 403
    logCsrfViolation(
      request.headers.get('x-forwarded-for') || 'unknown',
      request.nextUrl.pathname
    );
    
    return csrfResponse;
  }
  
  // WHAT: 3. Continue to route handler
  const response = NextResponse.next();
  
  // WHAT: 4. Add CSRF token to response if not present
  // WHY: Ensure client has valid token for subsequent requests
  if (!request.cookies.get('csrf-token')) {
    const newToken = generateCsrfToken();
    setCsrfTokenCookie(response, newToken);
  }
  
  // WHAT: 5. Log request completion
  // WHY: Track performance and API usage
  logRequestEnd(startTime, {
    method: request.method,
    pathname: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  });
  
  return response;
}

// WHAT: Middleware matcher configuration
// WHY: Only run middleware on API routes and admin pages (not static assets)
export const config = {
  matcher: [
    // WHAT: API routes (all endpoints)
    '/api/:path*',
    
    // WHAT: Admin pages (protected area)
    '/admin/:path*',
    
    // WHAT: Public stats pages (rate limiting applies)
    '/stats/:path*',
    
    // WHAT: Exclude static files and assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
};
