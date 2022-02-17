/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      crypto: false,
      path: false,
      stream: false,
      https: false,
      http: false,
      os: false,
    }

    return config
  },
}

module.exports = nextConfig
