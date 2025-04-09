import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@internal/components'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/projects',
        permanent: false
      }
    ];
  },
  async rewrites() {
    return [];
  }
};

export default nextConfig;
