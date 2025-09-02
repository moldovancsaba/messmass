/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent dependency conflicts
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is enabled
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
