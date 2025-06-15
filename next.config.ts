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
  // Убираем экспериментальные функции, которые вызывают ошибки
  // experimental: {
  //   // Оптимизация размера бандла - временно отключено из-за ошибки critters
  //   optimizeCss: true,
  // },
};

export default nextConfig;