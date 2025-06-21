import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Docker standalone output
  output: 'standalone',
  // React 19.1 optimizations
  experimental: {},
  // Turbopack configuration - using default SWC compilation
  // turbopack: {
  //   rules: {
  //     '*.tsx': {
  //       loaders: ['@next/swc-loader'],
  //     },
  //   },
  // },
  // React 19.1 compatibility packages
  transpilePackages: [
    '@radix-ui/react-checkbox',
    '@radix-ui/react-label',
    '@radix-ui/react-form',
    '@hookform/resolvers',
  ],
  // Webpack optimizations for React 19 - disabled for Turbopack
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     };
  //   }
  //   return config;
  // },
};

export default withNextIntl(nextConfig);