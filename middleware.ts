// middleware.ts
// WHAT: Next.js middleware for security and monitoring
// WHY: Centralized security enforcement before requests reach API handlers
// HOW: Rate limiting → CSRF protection → Logging → Continue to handler

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitConfig } from '@/lib/rateLimit';
import { csrfProtectionMiddleware, setCsrfTokenCookie, generateCsrfToken } from '@/lib/csrf';
import { logRequestEnd, logRateLimitExceeded, logCsrfViolation } from '@/lib/logger';
import { buildCorsHeaders } from '@/lib/cors';

// WHAT: Check if admin session cookie exists and is valid
// WHY: Protect ALL admin pages from unauthorized access
function hasValidAdminSession(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin-session');
  
  if (!adminSession?.value) {
    return false;
  }
  
  try {
    // Decode base64 session token
    const json = Buffer.from(adminSession.value, 'base64').toString();
    const tokenData = JSON.parse(json);
    
    if (!tokenData?.token || !tokenData?.expiresAt || !tokenData?.userId) {
      return false;
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expiresAt);
    const now = new Date();
    
    if (now > expiresAt) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// WHAT: Main middleware function (runs on every request)
// WHY: Apply security controls before request reaches route handlers
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // WHAT: 0. Check admin authentication (CRITICAL SECURITY)
  // WHY: Prevent unauthorized access to ALL admin pages
  // EXCEPTION: /admin/login is public (users need to access it to log in)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isAuthenticated = hasValidAdminSession(request);
    
    if (!isAuthenticated) {
      console.warn(`⚠️  Unauthorized admin access attempt: ${pathname}`);
      // Redirect to login page
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
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
  
  // WHAT: Handle CORS preflight early
  if (request.method === 'OPTIONS') {
    const headers = buildCorsHeaders(request);
    // Always respond to preflight with 204 (no content)
    return new NextResponse(null, { status: 204, headers });
  }

  // WHAT: 3. Continue to route handler
  const response = NextResponse.next();

  // WHAT: Attach CORS headers to downstream response
  const corsHeaders = buildCorsHeaders(request);
  corsHeaders.forEach((v, k) => response.headers.set(k, v));
  
  // NOTE: Cookie setting removed from middleware - Next.js middleware cannot reliably set cookies
  // CSRF tokens are now set via /api/csrf-token endpoint, which clients must call on first load
  // See: lib/apiClient.ts ensureCsrfToken() for automatic token fetching
  
  // WHAT: 4. Log request completion
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
    
    // WHAT: Public report pages (rate limiting applies)
    '/report/:path*',
    '/partner-report/:path*',
    
    // WHAT: Exclude static files and assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
};
