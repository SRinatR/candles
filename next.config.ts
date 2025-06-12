import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  // Добавляем output: 'standalone' для Docker
  output: 'standalone',
  // Экспериментальные функции для лучшей производительности
  experimental: {
    // Оптимизация размера бандла
    optimizeCss: true,
  },
};

export default nextConfig;