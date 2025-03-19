/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Needed for Docker
  experimental: {
    // This is critical - explicitly mark mongodb as server-only
    serverComponentsExternalPackages: ['mongodb', 'mongoose'],
    // Add server actions support
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    // Only exclude mongodb in client-side bundles
    if (!isServer) {
      // Don't bundle mongodb or mongoose in client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        mongodb: false,
        mongoose: false,
        'mongodb-client-encryption': false,
        aws4: false,
      };
    }
    
    // Add a more specific rule for 'mongodb' imports
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add MongoDB as externals for server
    if (isServer) {
      config.externals = [...(config.externals || []), 'mongodb', 'mongoose'];
    }
    
    return config;
  },
}

module.exports = nextConfig 