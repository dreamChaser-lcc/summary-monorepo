# 前端构建工具深度对比：Webpack vs Rollup vs Vite

本文档总结了 Webpack、Rollup 和 Vite 三大主流构建工具的核心差异、适用场景及底层原理，并整理了高频面试题。

## 1. 核心定位与差异

| 特性 | **Webpack** | **Rollup** | **Vite** |
| :--- | :--- | :--- | :--- |
| **定位** | **大而全的应用打包器 (App Bundler)** | **小而美的库打包器 (Library Bundler)** | **下一代前端开发工具 (Dev Server + Bundler)** |
| **构建方式** | **Bundle (全量打包)**：无论开发还是生产，都先打包再运行。 | **Bundle (扁平化打包)**：专注于生成纯净的 ESM 代码。 | **No-Bundle (开发)** + **Bundle (生产)**：开发时利用浏览器原生 ESM，生产时使用 Rollup。 |
| **核心优势** | **工程能力强**：代码分割 (SplitChunks)、静态资源处理 (Loader)、HMR 稳定。 | **产物纯净**：Scope Hoisting (作用域提升) 让代码体积最小，无冗余代码。 | **开发体验极佳**：秒级启动，热更新速度与项目规模无关。 |
| **适用场景** | 大型 SPA、微前端、需要兼容旧浏览器、复杂资源处理。 | 开发 JS 库 (如 Vue/React 源码)、工具函数库、组件库。 | 绝大多数现代 Web 应用 (Vue3/React18)。 |

## 2. 运行时 (Runtime) 机制对比

### Webpack Runtime
*   **机制**：在浏览器中模拟了一套 **Node.js 风格的模块系统**。
*   **实现**：
    *   `__webpack_modules__`: 存放所有模块的函数映射表。
    *   `__webpack_require__`: 模拟 `require`，负责模块加载、缓存和执行。
*   **代价**：产物中包含大量“胶水代码”，体积较大，且每个模块执行都需要闭包开销。

### Rollup Runtime
*   **机制**：**Zero Runtime (零运行时)**。
*   **实现**：利用 **Scope Hoisting (作用域提升)**，将所有模块的代码逻辑“拍平”放到同一个函数作用域中。
*   **优势**：代码体积最小，执行效率最高（无闭包开销）。
*   **例外**：仅在代码分割（动态导入）时引入微量的加载器代码。

### Vite Runtime
*   **开发环境**：几乎**无运行时**。利用浏览器原生的 `<script type="module">`，浏览器负责发请求，Vite Server 负责按需编译返回。
*   **生产环境**：使用 Rollup 打包，继承了 Rollup 的零运行时优势。

## 3. 核心特性深度解析

### 3.1 Tree Shaking (摇树优化)
*   **定义**：消除未引用的死代码 (Dead Code Elimination)。
*   **前提**：必须使用 **ES Module (`import/export`)** 语法，因为 ESM 是静态的，可以进行静态分析。CommonJS 是动态的，无法 Tree Shaking。
*   **Webpack**：通过标记 `unused harmony export`，在压缩阶段 (Terser) 删除死代码。需要配置 `sideEffects: false` 避免误删 CSS。
*   **Rollup**：**Tree Shaking 的鼻祖**。原生支持，效果通常比 Webpack 更彻底。

### 3.2 Code Splitting (代码分割)
*   **Webpack**：**最强**。
    *   `SplitChunksPlugin`: 可以精细控制公共代码提取、按体积拆分、按路由拆分。
    *   支持 `prefetch/preload` 指令。
*   **Rollup/Vite**：相对较弱。
    *   主要依赖 ESM 的动态导入语法。
    *   容易产生“碎片化 Chunk” (大量小文件) 问题。

### 3.3 HMR (热更新) 原理
*   **Webpack**：
    *   修改文件 -> 重新编译模块 -> 通过 WebSocket 推送 Hash -> 浏览器下载更新的 Chunk -> 运行时替换模块 -> 触发 `module.hot.accept` 回调。
    *   随着项目变大，重新编译的时间会变长。
*   **Vite**：
    *   修改文件 -> Server 只需要编译这一个文件 -> 通过 WebSocket 推送消息 -> 浏览器重新请求该文件。
    *   速度始终是 O(1)，与项目总大小无关。

## 4. esbuild 的角色
*   **是什么**：用 Go 语言编写的极速构建工具。
*   **在 Vite 中**：
    *   用于 **依赖预构建 (Pre-bundling)**：将 CommonJS 依赖转为 ESM，并合并请求。
    *   用于 **TS/JSX 转译**：开发环境秒级编译。
    *   **不用于生产打包**：因为 esbuild 的代码分割和 CSS 处理不够成熟，生产环境依然用 Rollup。
*   **在 Webpack 中**：
    *   可以通过 `esbuild-loader` 替代 `babel-loader` 和 `ts-loader`。
    *   可以通过 `ESBuildMinifyPlugin` 替代 `TerserPlugin` 进行压缩。

## 5. 高频面试题

### Q1: 为什么 Vite 启动这么快？
*   **No-Bundle**：开发环境不需要打包，利用浏览器原生 ESM。
*   **esbuild**：使用 Go 编写的 esbuild 进行依赖预构建，比 JS 快 10-100 倍。
*   **按需编译**：只有当浏览器请求某个页面时，Vite 才会编译该页面用到的文件。

### Q2: Webpack 和 Rollup 怎么选？
*   **看产物**：做应用选 Webpack (代码分割强，静态资源处理好)；做库选 Rollup (产物干净，体积小)。
*   **看生态**：需要各种奇葩 Loader (如 `.swf`, `.node`) 选 Webpack；追求标准 ESM 选 Rollup。

### Q3: 什么是 Scope Hoisting？有什么好处？
*   **定义**：将多个模块的代码合并到一个函数作用域中，而不是每个模块一个闭包。
*   **好处**：
    1.  **减小体积**：去掉了大量的模块包装函数和 `require` 调用。
    2.  **提高性能**：减少了函数闭包的内存开销，加快了代码执行速度。

### Q4: Vite 生产环境为什么要用 Rollup 而不用 esbuild？
*   **代码分割**：Rollup 的 split chunks 策略更成熟。
*   **CSS 处理**：Rollup 对 CSS 的提取和压缩支持更好。
*   **生态兼容**：Rollup 插件生态丰富，且 Vite 插件 API 设计上兼容 Rollup。
*   esbuild 虽然快，但在构建应用级产物（特别是复杂的代码分割和资源处理）方面还不如 Rollup 稳健。

### Q5: 为什么说 Webpack 适合“复杂构建”？
*   **模块联邦**：原生支持微前端，解决依赖共享问题。
*   **容错性**：能处理 CommonJS/AMD/ESM 混用、循环依赖、动态 require 等“脏乱差”的情况。
*   **精细控制**：对 Chunk 的拆分、加载优先级、资源内联等有极细粒度的控制能力。
