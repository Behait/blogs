import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用实验性功能
  experimental: {
    // 启用 Turbo 模式（如果可用）
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // 图片优化配置
  images: {
    // 启用图片优化
    formats: ['image/webp', 'image/avif'],
    // 允许的图片域名
    domains: ['localhost'],
    // 图片尺寸
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL || '' : '',

  // 输出配置
  output: 'standalone',

  // 重定向和重写
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=(), camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; img-src 'self' data: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https: http:; font-src 'self' data: https: http:; connect-src 'self' https: http: data:; upgrade-insecure-requests; block-all-mixed-content",
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack 配置优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    // 添加 bundle 分析
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向配置
  async redirects() {
    return [
      // 将旧的查询参数链接重定向到新的分类/标签路径
      {
        source: '/',
        has: [
          { type: 'query', key: 'category', value: '(?<slug>[^&]+)' },
          { type: 'query', key: 'page', value: '(?<page>\\d+)' },
        ],
        destination: '/c/:slug?page=:page',
        permanent: true,
      },
      {
        source: '/',
        has: [
          { type: 'query', key: 'category', value: '(?<slug>[^&]+)' },
        ],
        destination: '/c/:slug',
        permanent: true,
      },
      {
        source: '/',
        has: [
          { type: 'query', key: 'tag', value: '(?<slug>[^&]+)' },
          { type: 'query', key: 'page', value: '(?<page>\\d+)' },
        ],
        destination: '/t/:slug?page=:page',
        permanent: true,
      },
      {
        source: '/',
        has: [
          { type: 'query', key: 'tag', value: '(?<slug>[^&]+)' },
        ],
        destination: '/t/:slug',
        permanent: true,
      },
      // 兼容旧搜索键 q -> search
      {
        source: '/',
        has: [
          { type: 'query', key: 'q', value: '(?<q>.*)' },
        ],
        destination: '/?search=:q',
        permanent: true,
      },
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      // 可以在这里添加重写规则
    ];
  },
};

export default nextConfig;
