# Webpack 优化思路总结与实战

本文基于项目 `summary-monorepo` 中的 `app/webpack-react` 模块配置，总结常见的 Webpack 优化策略。

## 一、构建速度优化 (Build Speed)

目标是减少 `npm run build` 或 `npm start` 的等待时间，提升开发体验。

### 1. Loader 优化
*   **缩小范围 (Exclude/Include)**：
    *   **原理**：Loader 处理文件耗时，应尽量减少处理的文件数量。
    *   **实践**：在配置中明确排除 `node_modules`，避免编译第三方库。
    *   **代码参考**：
        ```javascript
        // app/webpack-react/build/webpack.prod.config.js
        {
          test: /\.(tsx|ts|js|jsx)$/,
          exclude: /node_modules/, // 关键配置
          use: ['swc-loader'],
        }
        ```

*   **使用更快的编译器 (SWC/Esbuild)**：
    *   **原理**：SWC (基于 Rust) 和 Esbuild (基于 Go) 比 Babel 快非常多（单线程快 20 倍，多核快 70 倍）。
    *   **实践**：项目中通过 `transformCodeWay` 函数灵活切换编译器。
    *   **代码参考**：
        ```javascript
        // app/webpack-react/build/webpack.prod.config.js
        const transformCodeWay = (params) => {
          // ...
          if (params.useSwc) {
            return [{
              test: /\.(tsx|ts|js|jsx)$/,
              use: ['swc-loader'], // 使用 swc-loader 替代 babel-loader
            }]
          }
          // ...
        }
        ```

### 2. DllPlugin (动态链接库)
*   **原理**：将不常变化的第三方库（如 React、ReactDOM）预先打包成一个 DLL 文件，后续构建时直接引用，不再重复编译。
*   **实践**：项目中单独配置了 `webpack.dll.config.js`。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.dll.config.js
    entry: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
    },
    output: {
      filename: '[name].[contenthash:10].dll.js',
      library: '[name]_[fullhash]',
    }
    ```

### 3. 多进程/多线程构建
*   **原理**：利用多核 CPU 并行处理耗时任务。
*   **实践**：在压缩代码时开启多进程。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.prod.config.js
    new TerserPlugin({
      parallel: os.cpus.length - 1, // 开启多进程压缩
    })
    ```

### 4. Resolve 解析优化
*   **原理**：减少 Webpack 查找文件路径的时间。
*   **实践**：配置 `extensions`（后缀列表）、`modules`（搜索目录）和 `mainFields`（入口字段）。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.base.config.js
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      mainFields: ['browser', 'module', 'main'],
    }
    ```

---

## 二、产物性能优化 (Output Performance)

目标是减小打包体积（Bundle Size），加快页面加载速度，提升用户体验。

### 1. 代码分割 (Code Splitting)
*   **原理**：将代码拆分成多个小块，按需加载或并行加载。
*   **实践**：配置 `optimization.splitChunks`，将第三方库和业务代码分离。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.prod.config.js
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          filename: 'js/[name].[contenthash:10].chunk.js',
          priority: -10,
        },
      },
    }
    ```

### 2. Tree Shaking (摇树优化)
*   **原理**：移除未引用的代码（Dead Code）。
*   **实践**：生产模式 (`mode: 'production'`) 默认开启。

### 3. CDN 引入 (Externals)
*   **原理**：将体积巨大的第三方库（如 React）排除在打包文件之外，通过 CDN 引入。
*   **实践**：通过 `externals` 配置排除库，并配合 `html-webpack-plugin` 注入 CDN 链接。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.prod.config.js
    const externals = {
      'react': 'React',
      "react-dom": 'ReactDOM',
    };
    // 注入 CDN 链接
    const externalsCdns = [
      "https://cdn.bootcdn.net/ajax/libs/react/18.2.0/umd/react.production.min.js",
      // ...
    ];
    ```

### 4. 代码压缩 (Minification)
*   **原理**：去除空格、注释，缩短变量名。
*   **实践**：使用 `TerserPlugin` (JS) 和 `CssMinimizerPlugin` (CSS)。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.prod.config.js
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin({/*...*/}),
      ],
    }
    ```

### 5. CSS 提取
*   **原理**：将 CSS 提取为独立文件，利用浏览器并行下载，且避免 JS 阻塞渲染。
*   **实践**：使用 `MiniCssExtractPlugin`。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.prod.config.js
    new MiniCssExtractPlugin({
      filename: `css/[name].[contenthash:10].css`,
    })
    ```

### 6. 长效缓存 (Long-term Caching)
*   **原理**：文件名包含内容哈希，内容变了文件名才变，最大化利用浏览器缓存。
*   **实践**：在输出文件名中使用 `[contenthash]`。
*   **代码参考**：
    ```javascript
    // app/webpack-react/build/webpack.base.config.js
    output: {
      filename: '[name].[contenthash].bundle.js',
    }
    ```

## 三、进阶建议

1.  **开启 Webpack 5 持久化缓存**：配置 `cache: { type: 'filesystem' }` 可极大提升二次构建速度。
2.  **打包体积分析**：使用 `webpack-bundle-analyzer` 插件可视化分析包体积。
3.  **图片压缩**：配合 `image-webpack-loader` 在构建时自动压缩图片资源。

---

## 四、Webpack vs Rollup vs SWC vs Esbuild 深度解析

在现代前端工程化中，这四个工具经常被拿来比较。以下是它们的核心区别、适用场景及原理分析。

### 1. Webpack vs Rollup

| 特性 | Webpack | Rollup |
| :--- | :--- | :--- |
| **定位** | **应用打包器 (Application Bundler)** | **库打包器 (Library Bundler)** |
| **核心优势** | 功能极其强大，资源处理 (Loader)、代码分割 (SplitChunks)、HMR 完善 | 产物极其干净、扁平 (Scope Hoisting)，ESM 支持原生 |
| **Tree Shaking** | **标记 + 压缩**：依赖 Terser 等插件真正移除代码，会有包装代码 | **静态分析**：原生支持，直接生成扁平代码，更彻底 |
| **适用场景** | 构建复杂的 **React/Vue 应用** | 构建 **工具库、组件库、SDK** |

**结论**：遵循 "Webpack for Apps, Rollup for Libraries" 原则。

### 2. SWC vs Esbuild

这两个都是高性能编译器，旨在解决构建速度慢的问题。

| 特性 | SWC (Speedy Web Compiler) | Esbuild |
| :--- | :--- | :--- |
| **语言** | **Rust** | **Go** |
| **定位** | **Babel 的高性能替代品** | **Webpack 的高性能替代品** (打包+压缩) |
| **兼容性 (ES5)** | **支持** (可降级到 IE11) | **不支持** (最低 ES6) |
| **速度** | 单核 20x Babel，多核 70x | 极快 (通常比 SWC 略快) |
| **插件生态** | Rust/WASM (门槛高，生态暂弱) | Go/JS (简单，生态较弱) |

**选型建议**：
*   **生产构建 (需兼容性)**：**SWC**。它能完美替代 Babel 进行 ES5 降级。
*   **开发环境 / 压缩**：**Esbuild**。Vite 开发环境用它做预构建，生产环境用它做压缩。

### 3. 为什么 Esbuild 这么快？

1.  **并行化 (Parallelism)**：充分利用多核 CPU，解析、打印、SourceMap 生成全流程并行。
2.  **内存管理**：Go 语言编写，精心设计的内存结构，尽量复用 AST 节点，实现 **零拷贝 (Zero-copy)**。
3.  **一体化设计**：集成了打包、编译、压缩，无需像 Webpack 那样在 Loader/Plugin 间反复转换 AST 和字符串。
4.  **从零编写**：不依赖任何第三方解析器，无历史包袱。

### 4. Vite 的架构选择

Vite 巧妙地结合了这两类工具的优势：

*   **开发环境 (Dev)**：使用 **Esbuild** 进行依赖预构建 (Pre-bundling) 和源码转译。利用其极致速度实现“秒开”和毫秒级 HMR。
*   **生产环境 (Build)**：
    *   **打包**：使用 **Rollup**。利用其成熟的代码分割和 CSS 处理能力。
    *   **压缩**：默认使用 **Esbuild**。利用其比 Terser 快 20-40 倍的压缩速度（注意：如果需兼容 IE11，需切换回 Terser）。
