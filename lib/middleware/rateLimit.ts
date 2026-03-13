import { NextResponse } from 'next/server';

/**
 * Basic in-memory rate limiter for Next.js Edge/API routes.
 * In a production multi-instance environment, this should ideally be backed by Redis.
 * For this phase, we use an in-memory Map as a lightweight foundation.
 */

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitTracker>();

export interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

/**
 * Applies rate limiting based on key (usually IP or User ID).
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const tracker = rateLimitStore.get(key);

  if (!tracker) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  // Window expired, reset
  if (now > tracker.resetAt) {
    tracker.count = 1;
    tracker.resetAt = now + config.windowMs;
    return true;
  }

  // Within window, check count
  if (tracker.count >= config.maxRequests) {
    return false;
  }

  tracker.count++;
  return true;
}

/**
 * Helper to wrap API handlers with rate limiting.
 */
export function withRateLimit(req: Request, config: RateLimitConfig, handler: () => Promise<NextResponse> | NextResponse) {
  // Try to get IP, fallback to arbitrary string if missing
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';
  const path = new URL(req.url).pathname;
  const key = `${ip}:${path}`;

  if (!checkRateLimit(key, config)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handler();
}

// Pre-defined policies
export const RATE_LIMIT_POLICIES = {
  AUTH: { maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'), windowMs: 60 * 1000 }, // 5 / min
  API: { maxRequests: parseInt(process.env.RATE_LIMIT_API_MAX || '100'), windowMs: 60 * 1000 } // 100 / min
};
