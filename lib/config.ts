// lib/config.ts
// Centralized configuration and environment variables resolver for MessMass.
// WHAT: Provides a single, typed source of truth for env-driven values.
// WHY: Prevents divergence (e.g., repeated MONGODB_DB fallbacks) and enforces
//     consistent behavior across API routes, libraries, and pages.

export type AppConfig = {
  mongodbUri: string;
  dbName: string;
  adminPassword: string; // Note: project uses a simple password auth — value comes from env
  nextPublicWsUrl?: string; // Optional, for real-time server if configured
  nodeEnv: 'development' | 'production' | 'test' | string;
  ssoBaseUrl: string; // Centralized SSO service base URL to avoid hard-coded strings in API routes
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    // We keep throw behavior for critical secrets; callers can catch if needed.
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
  mongodbUri: requireEnv('MONGODB_URI'),
  dbName: process.env.MONGODB_DB?.trim() || 'messmass',
  adminPassword: (process.env.ADMIN_PASSWORD?.trim() || 'messmass'),
  nextPublicWsUrl: process.env.NEXT_PUBLIC_WS_URL?.trim() || undefined,
  nodeEnv: process.env.NODE_ENV || 'development',
  // WHAT: Default SSO base URL configured here.
  // WHY: Avoid hard-coded URLs in API routes and enable environment-based overrides in the future.
  ssoBaseUrl: process.env.SSO_BASE_URL?.trim() || 'https://sso.doneisbetter.com',
};

export default config;
