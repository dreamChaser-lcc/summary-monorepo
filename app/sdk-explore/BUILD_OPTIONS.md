# 构建选项说明

## 命令行参数

现在可以通过命令行参数来控制构建行为：

### 可用参数

- `--use-esbuild=true|false` - 是否使用 esbuild（默认：true）
- `--use-const=true|false` - 是否使用 const 变量（默认：true）
- `--throw-on-error=true|false` - TypeScript 错误时是否停止构建（默认：true）
- `--preserve-modules=true|false` - 是否保留模块目录结构（默认：true）

### 使用方式

#### 1. 直接使用 rollup 命令

```bash
# 使用 esbuild
pnpm rollup -c rollup.config.mjs --use-esbuild=true

# 使用 TypeScript 插件
pnpm rollup -c rollup.config.mjs --use-esbuild=false

# 组合多个参数
pnpm rollup -c rollup.config.mjs --use-esbuild=true --throw-on-error=false
```

#### 2. 使用预定义的 npm scripts

```bash
# 默认构建（使用当前配置）
pnpm run build

# 强制使用 esbuild
pnpm run build:esbuild

# 强制使用 TypeScript 插件
pnpm run build:typescript

# 开发模式（不在错误时停止）
pnpm run build:dev

# 生产模式（严格模式）
pnpm run build:prod
```

## 构建工具对比

### ESBuild

- ✅ 构建速度快
- ✅ 现代语法支持好
- ✅ TypeScript 集成好
- ❌ 配置选项相对较少

### TypeScript 插件

- ✅ 配置选项丰富
- ✅ 完整的 TypeScript 支持
- ❌ 构建速度较慢
- ⚠️ 需要正确的 tsconfig.json 配置

## 构建输出

### 文件结构

```
dist/
├── sdk.d.ts          # TypeScript 声明文件
├── cjs/              # CommonJS 格式
│   ├── index.cjs
│   └── src/
└── es/               # ES Module 格式
    ├── index.mjs
    └── src/

cdn/                  # 浏览器格式（自包含）
├── index.js          # IIFE 格式 (21.59 KB)
├── index.min.js      # IIFE 压缩版 (12.34 KB)
├── index.esm.js      # ES Module 格式 (20.18 KB)
└── index.umd.js      # UMD 格式 (21.89 KB)
```

### CDN 版本特点

- **自包含**：包含所有本地代码，无需额外依赖
- **多格式支持**：IIFE、UMD、ESM 三种格式
- **压缩版本**：提供 minified 版本，减少文件大小
- **外部依赖**：只有 `axios` 作为外部依赖，需要单独引入

## 重要修复说明

### CDN 构建问题修复

之前 CDN 构建结果只包含导出语句，没有实际代码内容。这是因为：

**问题原因：**

- CDN 构建配置中使用了 `externals()` 插件
- 该插件将所有模块（包括本地模块）标记为外部依赖
- 导致本地代码不被打包进最终文件

**解决方案：**

- 移除 CDN 构建中的 `externals()` 插件
- 只将 `axios` 标记为外部依赖
- 确保所有本地代码被打包进 CDN 文件

**修复后效果：**

- CDN 文件现在包含完整的 `WebSocketClient` 和 `HttpClient` 代码
- 文件大小合理（压缩后约 12KB）
- 可以直接在浏览器中使用

## 注意事项

1. **TypeScript 插件警告**：使用 TypeScript 插件时，会提示需要将 `tsconfig.json` 中的 `module` 设置为 `esnext`，但这不影响构建结果。

2. **配置优先级**：命令行参数 > 默认值

3. **CDN 使用**：CDN 版本需要先引入 `axios`，然后再引入 SDK 文件

4. **外部依赖警告**：构建时会出现关于 `axios` 的警告，这是正常的，因为我们将其设置为外部依赖

## 推荐使用

- **开发阶段**：`pnpm run build:dev` - 快速构建，不在错误时停止
- **生产发布**：`pnpm run build:prod` - 严格模式，确保代码质量
- **调试 TypeScript**：`pnpm run build:typescript` - 使用 TypeScript 插件获得更详细的错误信息
- **CDN 发布**：使用 `cdn/index.min.js` 获得最小的文件大小
