// lib/rateLimit.ts
// WHAT: Rate limiting middleware to prevent DDoS and brute-force attacks
// WHY: Critical security control - limits requests per IP to prevent abuse
// HOW: In-memory token bucket algorithm with sliding window tracking

import { NextRequest, NextResponse } from 'next/server';

// WHAT: Rate limit configuration per endpoint type
// WHY: Different endpoints need different limits (auth vs. read-only)
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in window
  message?: string;      // Custom error message
}

// WHAT: Request tracking entry
interface RequestEntry {
  count: number;         // Number of requests in current window
  resetTime: number;     // Timestamp when window resets (ms since epoch)
}

// WHAT: In-memory store for rate limit tracking
// WHY: Simple MVP solution, no external dependencies required
// NOTE: For production scale (multiple servers), migrate to Redis
const requestStore = new Map<string, RequestEntry>();

// WHAT: Default rate limit configurations
// WHY: Sensible defaults prevent most attacks while allowing normal usage
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,             // 5 attempts per 15min
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  
  // Write operations (POST, PUT, DELETE) - moderate limits
  WRITE: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 30,            // 30 writes per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Read operations (GET) - generous limits
  READ: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100,           // 100 reads per minute
    message: 'Too many requests. Please slow down.',
  },
  
  // Public stats pages - very generous limits
  PUBLIC: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 60,            // 60 requests per minute
    message: 'Rate limit exceeded. Please try again shortly.',
  },
} as const;

// WHAT: Clean up expired entries from memory store
// WHY: Prevent memory leaks from abandoned IP addresses
// HOW: Remove entries older than 24 hours
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  for (const [key, entry] of requestStore.entries()) {
    if (entry.resetTime < oneDayAgo) {
      requestStore.delete(key);
    }
  }
}

// WHAT: Run cleanup every hour
// WHY: Keep memory usage bounded without impacting performance
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

// WHAT: Get client identifier for rate limiting
// WHY: Track requests per IP address (or user session if authenticated)
// HOW: Use X-Forwarded-For header (Vercel/proxy) or direct IP
export function getClientIdentifier(request: NextRequest): string {
  // WHAT: Check for forwarded IP (behind proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // WHAT: X-Forwarded-For can contain multiple IPs, use first (client IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  // WHAT: Check for real IP header (Vercel-specific)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // WHAT: Fallback to host header or unknown
  // WHY: NextRequest doesn't expose ip directly
  const host = request.headers.get('host') || 'unknown';
  
  return host;
}

// WHAT: Check if request exceeds rate limit
// WHY: Core rate limiting logic with sliding window algorithm
// HOW: Token bucket - refill tokens at reset time
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = requestStore.get(identifier);
  
  // WHAT: No previous requests - create new entry
  if (!entry) {
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  // WHAT: Window expired - reset counter
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + config.windowMs;
    requestStore.set(identifier, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // WHAT: Within window - check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }
  
  // WHAT: Within limits - increment counter
  entry.count += 1;
  requestStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// WHAT: Rate limiting middleware for Next.js API routes
// WHY: Reusable middleware that can be applied to any route
// HOW: Returns NextResponse with 429 status if limit exceeded
export async function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // WHAT: Get client identifier (IP address)
  const identifier = getClientIdentifier(request);
  
  // WHAT: Generate rate limit key (identifier + route path)
  // WHY: Different endpoints have different limits
  const rateLimitKey = `${identifier}:${request.nextUrl.pathname}`;
  
  // WHAT: Check rate limit
  const result = checkRateLimit(rateLimitKey, config);
  
  // WHAT: Add rate limit headers to response (informational)
  // WHY: Helps clients implement exponential backoff
  const headers = new Headers({
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  });
  
  // WHAT: If rate limit exceeded, return 429 Too Many Requests
  if (!result.allowed) {
    headers.set('Retry-After', result.retryAfter!.toString());
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter: result.retryAfter,
        resetTime: new Date(result.resetTime).toISOString(),
      },
      {
        status: 429,
        headers,
      }
    );
  }
  
  // WHAT: Allowed - return null to continue to route handler
  // NOTE: Headers should be added to actual response by caller
  return null;
}

// WHAT: Helper to determine rate limit config based on request
// WHY: Automatically select appropriate limits for each endpoint type
export function getRateLimitConfig(request: NextRequest): RateLimitConfig {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // WHAT: Authentication endpoints - strictest limits
  if (pathname.startsWith('/api/admin/login') || pathname.startsWith('/api/auth')) {
    return RATE_LIMITS.AUTH;
  }
  
  // WHAT: Public stats pages - generous limits
  if (pathname.startsWith('/stats/') || pathname.startsWith('/hashtag/')) {
    return RATE_LIMITS.PUBLIC;
  }
  
  // WHAT: Write operations - moderate limits
  if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    return RATE_LIMITS.WRITE;
  }
  
  // WHAT: Read operations - generous limits
  return RATE_LIMITS.READ;
}

// WHAT: Export memory store size for monitoring
// WHY: Allows external monitoring of memory usage
export function getRateLimitStoreSize(): number {
  return requestStore.size;
}

// WHAT: Manual cleanup for testing
// WHY: Allows tests to reset state between runs
export function clearRateLimitStore(): void {
  requestStore.clear();
}
