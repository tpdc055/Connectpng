/** @type {import('next').NextConfig} */
const nextConfig = {
  // File tracing optimization moved to top level
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
      'node_modules/webpack/lib',
      'node_modules/terser/dist',
    ],
  },
  experimental: {
    // Keep only valid experimental options
  },
  // Server external packages for Prisma and bcrypt
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Optimize production builds
  compress: true,
  poweredByHeader: false,
  // Reduce function size
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Reduce server bundle size
      config.externals = [...(config.externals || []), 'sharp'];
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'vercel.app', 'same-assets.com'],
  },
}

module.exports = nextConfig
