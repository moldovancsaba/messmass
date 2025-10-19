// lib/cors.ts
// WHAT: Centralized CORS utilities
// WHY: Enable secure cross-origin requests (with credentials) for allowed origins only

import { NextRequest, NextResponse } from 'next/server';

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function isLocalhost(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = parseAllowedOrigins();
  if (allowed.length === 0) {
    // Default: allow same-origin and localhost only when no ALLOWED_ORIGINS configured
    return isLocalhost(origin);
  }
  return allowed.includes(origin);
}

export function buildCorsHeaders(request: NextRequest): Headers {
  const origin = request.headers.get('origin');
  const headers = new Headers();

  if (origin && isOriginAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  }

  return headers;
}

export function applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const cors = buildCorsHeaders(request);
  cors.forEach((v, k) => response.headers.set(k, v));
  return response;
}