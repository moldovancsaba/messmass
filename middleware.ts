// middleware.ts
// WHAT: Next.js middleware for security and monitoring
// WHY: Centralized security enforcement before requests reach API handlers
// HOW: Rate limiting → CSRF protection → Logging → Continue to handler

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitConfig } from '@/lib/rateLimit';
import { csrfProtectionMiddleware, setCsrfTokenCookie, generateCsrfToken } from '@/lib/csrf';
import { logRequestEnd, logRateLimitExceeded, logCsrfViolation, warn } from '@/lib/logger';
import { buildCorsHeaders } from '@/lib/cors';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/routeProtection';
import { validateSessionToken } from '@/lib/sessionTokens';
import type { UserRole } from '@/lib/users';

// WHAT: Main middleware function (runs on every request)
// WHY: Apply security controls before request reaches route handlers
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // WHAT: 0. Check admin authentication and authorization (CRITICAL SECURITY)
  // WHY: Prevent unauthorized/insufficient access to ALL admin pages
  // EXCEPTION: /admin/login, /admin/register, and /admin/clear-session are public
  const publicAdminRoutes = ['/admin/login', '/admin/register', '/admin/clear-session'];
  const isPublicRoute = publicAdminRoutes.some(route => pathname.startsWith(route));
  
  if (pathname.startsWith('/admin') && !isPublicRoute) {
    // WHAT: Step 1 - Check authentication (user has valid session)
    // WHY: Protect admin routes from unauthorized access
    const adminSession = request.cookies.get('admin-session');
    const sessionFormat = request.cookies.get('session-format')?.value as 'jwt' | 'legacy' | undefined;
    
    if (!adminSession?.value) {
      warn('Unauthenticated admin access attempt', { pathname });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // WHAT: Step 2 - Validate session token (supports both JWT and Base64)
    // WHY: Zero-downtime migration - supports both token formats
    // HOW: Uses unified validation that auto-detects format or uses format hint
    const tokenData = validateSessionToken(adminSession.value, sessionFormat);
    
    if (!tokenData) {
      warn('Invalid or expired session token', { pathname, format: sessionFormat });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // WHAT: Normalize role (historical tokens may use 'super-admin')
    // WHY: Backward compatibility with old token format
    const roleRaw = tokenData.role as string;
    const normalizedRole = roleRaw === 'super-admin' ? 'superadmin' : roleRaw;
    const userRole = normalizedRole as UserRole;
    
    // WHAT: Step 3 - Check role-based authorization
    // WHY: Enforce permission hierarchy (guest < user < admin < superadmin)
    if (!canAccessRoute(userRole, pathname)) {
      console.warn(`⚠️  Insufficient permissions: ${userRole} attempted ${pathname}`);
      const redirectPath = getUnauthorizedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectPath, request.url));
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
  
  // WHAT: Add Content Security Policy (CSP) headers
  // WHY: Prevent XSS attacks by restricting what resources can be loaded
  // HOW: Strict CSP that allows only same-origin resources and inline styles (for design tokens)
  // SECURITY: Phase 0 Task 0.1 - Secure Markdown Rendering
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for Next.js scripts
    "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for CSS custom properties (design tokens)
    "img-src 'self' data: https:", // Allow images from same origin, data URIs, and HTTPS
    "font-src 'self' data: https:", // Allow fonts from same origin, data URIs, and HTTPS (Google Fonts)
    "connect-src 'self'", // API calls to same origin only
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'", // Restrict base tag
    "form-action 'self'", // Restrict form submissions
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
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
