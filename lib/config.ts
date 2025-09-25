// lib/config.ts
// Centralized configuration and environment variables resolver for MessMass.
// WHAT: Provides a single, typed source of truth for env-driven values.
// WHY: Prevents divergence (e.g., repeated MONGODB_DB fallbacks) and enforces
//     consistent behavior across API routes, libraries, and pages.

export type AppConfig = {
  mongodbUri: string;
  dbName: string;
  // Security policy: do NOT provide a baked default for secrets. If callers need this, they must use env.require('ADMIN_PASSWORD').
  // Kept optional here to avoid import-time throws for modules that don’t use it at build time.
  adminPassword?: string;
  nextPublicWsUrl?: string; // Optional, for real-time server if configured
  nodeEnv: 'development' | 'production' | 'test' | string;
  // Remove hard-coded SSO default; this value must come from env or be undefined.
  ssoBaseUrl?: string;
  // Centralized service bases (server-only)
  appBaseUrl?: string;
  apiBaseUrl?: string;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) {
    // Strategic: fail fast for truly required values at the call site.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

// Resolve configuration with safe defaults where historically relied upon.
// Strategic choice:
// - mongodbUri: required (critical to run)
// - dbName: default to 'messmass' to match existing behavior
// - adminPassword: keep existing fallback for backward compatibility, though
//   production should set ADMIN_PASSWORD explicitly.
// - nextPublicWsUrl: optional; only used if real-time is enabled
export const config: AppConfig = {
  // WHAT: Required to run; throws early if not provided.
  mongodbUri: requireEnv('MONGODB_URI'),
  // WHY: dbName is non-sensitive and historically defaulted; keep default for DX (non-secret).
  dbName: getEnv('MONGODB_DB') || 'messmass',
  // SECURITY: no baked default for secrets; remain optional at config object level.
  adminPassword: getEnv('ADMIN_PASSWORD'),
  nextPublicWsUrl: getEnv('NEXT_PUBLIC_WS_URL'),
  nodeEnv: getEnv('NODE_ENV') || 'development',
  // SECURITY: remove hard-coded SSO default; must be provided via env if used.
  ssoBaseUrl: getEnv('SSO_BASE_URL'),
  // Service bases (server-only)
  appBaseUrl: getEnv('APP_BASE_URL'),
  apiBaseUrl: getEnv('API_BASE_URL'),
};

// Convenience helpers to encourage centralization and avoid direct process.env usage
export const env = {
  get: getEnv,
  require: requireEnv,
};

// Client-safe configuration: expose only NEXT_PUBLIC_* values
export function clientConfig() {
  return {
    appUrl: getEnv('NEXT_PUBLIC_APP_URL'),
    wsUrl: getEnv('NEXT_PUBLIC_WS_URL'),
  } as const;
}

export default config;
