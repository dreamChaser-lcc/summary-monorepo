This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 脚本说明 (Scripts)

本项目提供了一系列优化的 npm 脚本，用于开发、构建、部署和监控。

### 开发 (Development)
- **`npm run dev`**: 启动 Next.js 开发服务器 (热更新)。

### 构建与打包 (Build & Package)
- **`npm run build`**: 
  - 执行 `next build` 进行生产环境构建。
  - 自动运行 `scripts/package-standalone.js` 脚本。
  - **产物**: 生成 `dist/` 目录。这是一个**完全独立 (Standalone)** 的部署包，包含所有依赖和静态资源，无需安装 `node_modules` 即可运行。
- **`npm run package`**: 单独运行打包脚本 (通常在 build 之后手动修复打包问题时使用)。

### 部署与运行 (Run & Deploy)
- **`npm run start`**: 使用 Next.js 内置 CLI 启动生产服务 (依赖本地 node_modules)。
- **`npm run start:dist`**: 启动 `dist/` 目录下的独立包 (模拟真实部署环境运行)。

### 进程管理 (PM2)
推荐在生产环境使用 PM2 来管理 Node.js 进程。

- **`npm run pm2:start`**: 
  - 启动单实例服务。
  - 配置了内存限制 (500M)，超过自动重启。
  - 启用日志输出到 `./logs/`。
- **`npm run pm2:cluster` (推荐)**: 
  - 启动 **集群模式 (Cluster Mode)**。
  - 根据 CPU 核数自动启动多个实例 (max)，充分利用多核性能。
- **`npm run pm2:monitor`**: 打开 PM2 实时监控面板。
- **`npm run pm2:logs`**: 查看实时日志。
- **`npm run pm2:stop`**: 停止并删除服务。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
