/**
 * API Response Caching Utilities
 * 
 * WHAT: Utilities for implementing HTTP caching strategies
 * WHY: Reduce server load and improve client-side performance
 * 
 * Implements:
 * - Cache-Control headers for different resource types
 * - ETag support for conditional requests
 * - Stale-while-revalidate pattern
 * - Cache invalidation helpers
 */

import { NextResponse } from 'next/server';
import type { APIResponse } from '../types/api';

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATIONS = {
  // Static or rarely changing data
  CATEGORIES: 3600, // 1 hour
  HASHTAGS_LIST: 300, // 5 minutes
  
  // Frequently updated data
  PROJECTS_LIST: 60, // 1 minute
  PROJECT_DETAIL: 30, // 30 seconds
  
  // Real-time or user-specific data
  NO_CACHE: 0,
  
  // Stale-while-revalidate window
  STALE_WHILE_REVALIDATE: 60 // 1 minute
} as const;

/**
 * Cache strategies for different types of responses
 */
export type CacheStrategy = 
  | 'no-cache'           // Always revalidate
  | 'public'             // Cacheable by browsers and CDNs
  | 'private'            // Cacheable by browsers only
  | 'immutable';         // Never changes once created

/**
 * Options for cache configuration
 */
export interface CacheOptions {
  strategy: CacheStrategy;
  maxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  etag?: string;
}

/**
 * WHAT: Generate Cache-Control header value
 * WHY: Standardize caching behavior across API endpoints
 */
export function generateCacheControl(options: CacheOptions): string {
  const directives: string[] = [];
  
  if (options.strategy === 'no-cache') {
    directives.push('no-cache', 'no-store', 'must-revalidate');
    directives.push('max-age=0');
    return directives.join(', ');
  }
  
  // Add visibility directive
  directives.push(options.strategy);
  
  // Add max-age if specified
  if (options.maxAge !== undefined && options.maxAge > 0) {
    directives.push(`max-age=${options.maxAge}`);
  }
  
  // Add stale-while-revalidate for better UX
  if (options.staleWhileRevalidate !== undefined && options.staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  // Add must-revalidate if specified
  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  return directives.join(', ');
}

/**
 * WHAT: Generate ETag from response data
 * WHY: Enable conditional requests to reduce bandwidth
 */
export function generateETag(data: any): string {
  // Simple hash function for ETag generation
  // In production, consider using crypto.createHash for better collision resistance
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * WHAT: Add cache headers to Next.js response
 * WHY: Centralized function for consistent cache header application
 */
export function addCacheHeaders<T>(
  response: NextResponse<APIResponse<T>>,
  options: CacheOptions
): NextResponse<APIResponse<T>> {
  const cacheControl = generateCacheControl(options);
  response.headers.set('Cache-Control', cacheControl);
  
  // Add ETag if provided
  if (options.etag) {
    response.headers.set('ETag', options.etag);
  }
  
  // Add Vary header for content negotiation
  response.headers.set('Vary', 'Accept-Encoding');
  
  return response;
}

/**
 * WHAT: Create a cached response with appropriate headers
 * WHY: Single function for creating cacheable API responses
 */
export function cachedResponse<T>(
  data: APIResponse<T>,
  options: CacheOptions
): NextResponse<APIResponse<T>> {
  const response = NextResponse.json(data);
  
  // Generate ETag if not provided and data is present
  if (!options.etag && data.success && data.data) {
    options.etag = generateETag(data.data);
  }
  
  return addCacheHeaders(response, options);
}

/**
 * WHAT: Preset cache configurations for common scenarios
 * WHY: Simplify API endpoint caching with sensible defaults
 */
export const CACHE_PRESETS = {
  /**
   * For static or rarely changing data (categories, config)
   */
  STATIC: {
    strategy: 'public' as CacheStrategy,
    maxAge: CACHE_DURATIONS.CATEGORIES,
    staleWhileRevalidate: CACHE_DURATIONS.STALE_WHILE_REVALIDATE
  },
  
  /**
   * For frequently updated data (projects list, hashtags)
   */
  DYNAMIC: {
    strategy: 'public' as CacheStrategy,
    maxAge: CACHE_DURATIONS.PROJECTS_LIST,
    staleWhileRevalidate: CACHE_DURATIONS.STALE_WHILE_REVALIDATE
  },
  
  /**
   * For user-specific or real-time data
   */
  PRIVATE: {
    strategy: 'private' as CacheStrategy,
    maxAge: CACHE_DURATIONS.PROJECT_DETAIL,
    staleWhileRevalidate: CACHE_DURATIONS.STALE_WHILE_REVALIDATE
  },
  
  /**
   * For data that should never be cached
   */
  NO_CACHE: {
    strategy: 'no-cache' as CacheStrategy
  }
} as const;

/**
 * WHAT: Check if request includes If-None-Match header
 * WHY: Implement 304 Not Modified responses for efficiency
 */
export function checkIfNoneMatch(
  request: Request,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}

/**
 * WHAT: Create a 304 Not Modified response
 * WHY: Save bandwidth when client has fresh cached data
 */
export function notModifiedResponse(etag: string): NextResponse {
  const response = new NextResponse(null, { status: 304 });
  response.headers.set('ETag', etag);
  response.headers.set('Cache-Control', 'public, max-age=60');
  return response;
}

/**
 * WHAT: Cache key generator for in-memory caching (if needed)
 * WHY: Create consistent cache keys for server-side caching
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  return `${endpoint}?${sortedParams}`;
}

/**
 * WHAT: Example usage documentation
 * WHY: Show developers how to implement caching in their routes
 */
export const USAGE_EXAMPLES = {
  /**
   * Static data with long cache
   */
  staticExample: `
import { cachedResponse, CACHE_PRESETS } from '@/lib/api/caching';

export async function GET() {
  const categories = await db.collection('categories').find().toArray();
  
  return cachedResponse(
    {
      success: true,
      data: categories,
      meta: { timestamp: new Date().toISOString() }
    },
    CACHE_PRESETS.STATIC
  );
}
  `,
  
  /**
   * Dynamic data with ETag support
   */
  etagExample: `
import { cachedResponse, generateETag, checkIfNoneMatch, notModifiedResponse, CACHE_PRESETS } from '@/lib/api/caching';

export async function GET(request: NextRequest) {
  const projects = await db.collection('projects').find().toArray();
  const etag = generateETag(projects);
  
  // Check if client has fresh data
  if (checkIfNoneMatch(request, etag)) {
    return notModifiedResponse(etag);
  }
  
  return cachedResponse(
    {
      success: true,
      data: projects,
      meta: { timestamp: new Date().toISOString() }
    },
    {
      ...CACHE_PRESETS.DYNAMIC,
      etag
    }
  );
}
  `
};
