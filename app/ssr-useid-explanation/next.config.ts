import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 开启 Standalone 模式 (Docker 部署必备)
  // 生成最小化的 Node.js 服务端包，剔除 node_modules 中不需要的开发依赖
  output: 'standalone',

  // 2. React 严格模式 (默认开启)
  // 在开发环境会渲染两次组件，帮助发现副作用问题
  reactStrictMode: true,

  // 3. 图片优化配置
  images: {
    // 允许加载图片的远程域名 (例如 AWS S3, 阿里云 OSS)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
    // 图片压缩格式优先级
    formats: ['image/avif', 'image/webp'],
  },

  // 4. 自定义 HTTP Headers (安全与缓存)
  async headers() {
    return [
      {
        source: '/(.*)', // 对所有路由生效
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // 防止点击劫持
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // 防止 MIME 类型嗅探
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // 保护隐私
          },
        ],
      },
    ];
  },

  // 5. URL 重定向 (Redirects)
  // 永久重定向 (308) 或临时重定向 (307)
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/news/:slug', // 将旧博客地址迁移到新闻栏目
        permanent: true,
      },
      {
        source: '/home',
        destination: '/', // 将 /home 重定向到首页
        permanent: true,
      },
    ];
  },

  // 6. API 代理 (Rewrites)
  // 解决跨域问题，将 /api/external/* 转发到外部服务器
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'https://api.example.com/:path*', // 隐藏真实的后端 API 地址
      },
    ];
  },

  // 7. 编译器优化 (SWC)
  // 移除 console.log (仅在生产环境)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // 保留 console.error 和 console.warn
    } : false,
  },

  // 8. 实验性功能 (可选)
  experimental: {
    // 启用 Server Actions 的某些高级特性 (Next.js 14+ 默认已启用 Server Actions)
    // serverActions: {
    //   allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    // },
    
    // 优化包体积
    optimizePackageImports: ['lucide-react', 'lodash', 'date-fns'],
  },

  // 9. 环境变量 (构建时注入)
  // 注意：通常推荐使用 .env 文件，但这里也可以定义公共变量
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // 10. 禁用 x-powered-by header (安全)
  poweredByHeader: false,
};

export default nextConfig;
