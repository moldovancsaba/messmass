/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent dependency conflicts
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is enabled
  },
}

module.exports = nextConfig
