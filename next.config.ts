import type {NextConfig} from 'next';

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
    ],
  },
  // Добавляем output: 'standalone' для Docker
  output: 'standalone',
  // Настройки для React 19
  experimental: {
    reactCompiler: false, // Отключаем компилятор React пока что
  },
  // Настройки для совместимости с React 19
  transpilePackages: ['@radix-ui/react-checkbox', '@radix-ui/react-label'],
};

export default nextConfig;