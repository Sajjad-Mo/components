/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, 
  },
  // تنظیمات اضافه شده برای حل مشکل Radix UI
  reactStrictMode: true,
  transpilePackages: [
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-progress',
    '@radix-ui/react-dialog',
    '@radix-ui/react-popover',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot',
    '@radix-ui/react-tabs'
  ],
  // اضافه کردن تنظیمات webpack
  webpack: (config, { isServer }) => {
    // جلوگیری از باندل شدن ماژول‌های مشکل‌ساز
    config.externals = [...(config.externals || []), 
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-progress'
    ];
    
    return config;
  },
  output: 'standalone'
}

module.exports = nextConfig