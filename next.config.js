/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  typescript: {
    // Ignore TypeScript errors in supabase directory (Deno runtime, not Next.js)
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for webpack module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    // Exclude supabase directory from webpack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/**', '**/node_modules/**'],
    }
    // Ignore supabase directory in webpack
    config.ignoreWarnings = [
      ...config.ignoreWarnings || [],
      { module: /supabase/ },
    ]
    return config
  },
}

module.exports = nextConfig
