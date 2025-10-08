/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig
