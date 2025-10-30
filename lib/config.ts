// lib/config.ts
// Centralized configuration and environment variables resolver for MessMass.
// WHAT: Provides a single, typed source of truth for env-driven values.
// WHY: Prevents divergence (e.g., repeated MONGODB_DB fallbacks) and enforces
//     consistent behavior across API routes, libraries, and pages.
//
// ARCHITECTURE: Lazy initialization pattern
// WHY: Allows scripts to load dotenv before config validation runs
// WHEN: Config is validated on first access, not at module import time

export type AppConfig = {
  mongodbUri: string;
  dbName: string;
  // Security policy: do NOT provide a baked default for secrets. If callers need this, they must use env.require('ADMIN_PASSWORD').
  // Kept optional here to avoid import-time throws for modules that don't use it at build time.
  adminPassword?: string;
  nextPublicWsUrl?: string; // Optional, for real-time server if configured
  nodeEnv: 'development' | 'production' | 'test' | string;
  // Remove hard-coded SSO default; this value must come from env or be undefined.
  ssoBaseUrl?: string;
  // Centralized service bases (server-only)
  appBaseUrl?: string;
  apiBaseUrl?: string;
  // Bitly API integration (server-only)
  // WHAT: Access token for Bitly API v4 authentication
  // WHY: Required to fetch link analytics and manage shortened URLs for event tracking
  bitlyAccessToken?: string;
  // WHAT: Optional organization GUID for Bitly workspace
  // WHY: Identifies the Bitly organization workspace
  bitlyOrganizationGuid?: string;
  // WHAT: Group GUID for fetching links from specific Bitly group
  // WHY: Required for /groups/{guid}/bitlinks endpoint (some accounts don't support /user/bitlinks)
  bitlyGroupGuid?: string;
  // Football-Data.org integration (server-only)
  // WHAT: Token and base URL for Football-Data.org API
  // WHY: Enable fixture scheduling and team enrichment
  footballDataApiToken?: string;
  footballDataBaseUrl?: string;
  footballDataSyncIntervalHours?: number;
  footballDataAutoCreateProjects?: boolean;
  footballDataAutoCreatePartners?: boolean;
  // ImgBB API integration (server-only)
  // WHAT: API key for ImgBB image hosting service
  // WHY: Required for uploading partner report images from Clicker editor
  imgbbApiKey?: string;
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

// WHAT: Cached config instance for performance
// WHY: Initialize once, reuse forever - zero overhead after first access
let cachedConfig: AppConfig | null = null;

/**
 * WHAT: Lazy config initializer - validates and builds config on first access
 * WHY: Allows scripts to load dotenv before validation runs
 * HOW: Memoized singleton pattern - validates once, caches result
 */
function initializeConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Resolve configuration with safe defaults where historically relied upon.
  // Strategic choice:
  // - mongodbUri: required (critical to run)
  // - dbName: default to 'messmass' to match existing behavior
  // - adminPassword: keep existing fallback for backward compatibility, though
  //   production should set ADMIN_PASSWORD explicitly.
  // - nextPublicWsUrl: optional; only used if real-time is enabled
  cachedConfig = {
    // WHAT: Required to run; throws on first access if not provided.
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
    // Bitly API integration (server-only)
    // WHAT: Read Bitly credentials from environment variables
    // WHY: Required for importing link analytics from Bitly into MessMass event projects
    bitlyAccessToken: getEnv('BITLY_ACCESS_TOKEN'),
    bitlyOrganizationGuid: getEnv('BITLY_ORGANIZATION_GUID'),
    bitlyGroupGuid: getEnv('BITLY_GROUP_GUID'),
    // Football-Data.org integration (server-only)
    footballDataApiToken: getEnv('FOOTBALL_DATA_API_TOKEN'),
    footballDataBaseUrl: getEnv('FOOTBALL_DATA_BASE_URL') || 'https://api.football-data.org/v4',
    footballDataSyncIntervalHours: getEnv('FOOTBALL_DATA_SYNC_INTERVAL_HOURS') ? Number(getEnv('FOOTBALL_DATA_SYNC_INTERVAL_HOURS')) : 6,
    footballDataAutoCreateProjects: getEnv('FOOTBALL_DATA_AUTO_CREATE_PROJECTS') ? getEnv('FOOTBALL_DATA_AUTO_CREATE_PROJECTS') === 'true' : true,
    footballDataAutoCreatePartners: getEnv('FOOTBALL_DATA_AUTO_CREATE_PARTNERS') ? getEnv('FOOTBALL_DATA_AUTO_CREATE_PARTNERS') === 'true' : true,
    // ImgBB API integration
    imgbbApiKey: getEnv('IMGBB_API_KEY'),
  };

  return cachedConfig;
}

/**
 * WHAT: Lazy config proxy - validates on property access
 * WHY: Maintains same public API while deferring initialization
 * HOW: JavaScript Proxy intercepts property access and initializes config
 */
export const config = new Proxy({} as AppConfig, {
  get(_target, prop: string) {
    const cfg = initializeConfig();
    return cfg[prop as keyof AppConfig];
  },
  // WHAT: Support Object.keys(), JSON.stringify(), etc.
  ownKeys(_target) {
    const cfg = initializeConfig();
    return Reflect.ownKeys(cfg);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const cfg = initializeConfig();
    return Reflect.getOwnPropertyDescriptor(cfg, prop);
  },
});

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
