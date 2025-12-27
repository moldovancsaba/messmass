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
    // Disable ESLint during builds to prevent dependency conflicts
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is enabled
  },
  // WHAT: Exclude .next/cache from serverless function bundles
  // WHY: Prevents "Serverless Function has exceeded 250MB" error on Vercel
  // The cache directory is 240MB+ and shouldn't be in function bundles
  outputFileTracingExcludes: {
    '*': [
      '.next/cache/**/*',
      'node_modules/@swc/**/*',
    ],
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
