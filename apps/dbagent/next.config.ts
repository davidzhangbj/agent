import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true
  },
  reactStrictMode: false,
  transpilePackages: ['@internal/components'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store'
          }
        ]
      }
    ];
  },
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
    return [
      {
        source: '/:path*.map',
        destination: '/_next/static/:path*.map'
      }
    ];
  },
  output: 'standalone'
};

export default nextConfig;
