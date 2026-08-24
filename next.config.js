/** @type {import('next').NextConfig} */
const nextConfig = {
  // WHAT: Generate unique asset hashes for cache-busting
  // WHY: Ensures browsers always fetch latest version after deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // WHAT: Webpack configuration for server-only modules
  // WHY: Prevent bundling Node.js modules (fs, path) in client code
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules in client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        http: false,
        https: false,
        net: false,
      };
      // Exclude googleapis and google-auth-library from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        googleapis: 'commonjs googleapis',
        'google-auth-library': 'commonjs google-auth-library',
      });
    }
    return config;
  },
  eslint: {
    // WHAT: Run ESLint as part of `next build` (and thus every Vercel deploy).
    // WHY: Lint must gate production; CI also runs `npm run lint` as a second gate.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // WHAT: Skip Next.js's own build-time type-check.
    // WHY: type-check is already a separate, blocking CI gate (npm run
    //     type-check) on every push — this was a redundant second run of the
    //     same check, inside the production build itself. Observed live,
    //     twice: Vercel's build machine hangs or fails specifically on this
    //     step ("Linting and checking validity of types...") after GDS 6.1.0
    //     brought a much larger type surface (250+ components) — 14+ minutes
    //     with no progress once, a clean 401-style failure another time —
    //     while the identical check completes in seconds locally and in CI.
    //     Not a safety regression: a real type error still fails CI before
    //     merge, this only removes the duplicate, apparently fragile copy
    //     from the deploy path itself.
    ignoreBuildErrors: true,
  },
  // WHAT: Exclude .next/cache from serverless function bundles
  // WHY: Prevents "Serverless Function has exceeded 250MB" error on Vercel
  // The cache directory is 240MB+ and shouldn't be in function bundles
  outputFileTracingExcludes: {
    '*': [
      '.next/cache/**/*',
      'node_modules/@swc/**/*',
      // WHAT: the full `puppeteer` package (devDependency, local-dev-only PDF export
      // fallback — see app/api/export/pdf/route.ts) bundles its own ~300MB Chromium
      // download via a postinstall step.
      // WHY: it is only ever imported when NOT running on Vercel, but Next's file
      // tracer analyzes the import() target statically regardless of that runtime
      // branch, and would otherwise ship this into every function's bundle.
      'node_modules/puppeteer/**/*',
    ],
  },
  // WHAT: @sparticuz/chromium-min and puppeteer-core (production PDF export, see
  // app/api/export/pdf/route.ts) must stay real Node `require()`s, not get
  // webpack-bundled.
  // WHY: they resolve their own submodules via relative filesystem paths at runtime;
  // bundling breaks that resolution. This project first tried the full @sparticuz/chromium
  // package (self-contained, ~70MB bundled Chromium binary) with this same
  // serverExternalPackages entry, which was NOT enough on its own — the deployed function
  // threw "input directory .../bin does not exist" on the first real request, because
  // this only stops webpack bundling the package's JS; it does not make Vercel's
  // separate output-file-tracing step include the large binary assets the package
  // resolves via a runtime-constructed path, which static tracing can't discover.
  // A follow-up outputFileTracingIncludes attempt to force those files in also silently
  // had no effect, for an unrelated reason: this file already declares
  // outputFileTracingIncludes once further below (for the guides reader) and a duplicate
  // key later in the same object literal silently wins in plain JavaScript — the second
  // declaration was clobbering the first at parse time, no error, nothing. Rather than
  // merge two file-tracing needs into one object and rely on getting that exactly right,
  // -min sidesteps the entire class of problem: it has no bundled binary to trace at
  // all, downloading it from CHROMIUM_PACK_URL at runtime instead (see that constant's
  // comment in app/api/export/pdf/route.ts).
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  // WHAT: Bundle the user-guide markdown with the online reader routes.
  // WHY: /admin/help/guides reads docs/guides/*.md; keep the files traced into the
  //      function bundle so the reader works even if rendered on-demand.
  outputFileTracingIncludes: {
    '/admin/help/guides': ['./docs/guides/*.md'],
    '/admin/help/guides/[slug]': ['./docs/guides/*.md'],
  },
  // Redirect old hashtag pages to filter system
  async redirects() {
    return [
      {
        source: '/hashtag/:hashtag*',
        destination: '/filter/:hashtag',
        permanent: true, // 301 redirect for SEO preservation
      },
    ];
  },
  // WHAT: Aggressive cache-busting headers for HTML and assets
  // WHY: Browser caching causes stale UI issues after deployments
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // WHAT: Cache static assets with versioned URLs (Next.js auto-hashes these)
        // WHY: Safe to cache aggressively since URLs change when content changes
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // WHAT: Short cache for favicon with version param support
        // WHY: Favicons are notoriously cached; allow quick updates
        source: '/favicon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
