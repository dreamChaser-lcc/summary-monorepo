# WebAssembly 演示：Rust 数学计算（阶乘与矩阵乘法）

本 Demo 通过浏览器对比 JavaScript 与 WebAssembly（Rust）的性能与开发体验，涵盖模块加载、函数调用、错误处理、性能分析与扩展实践。

## 快速开始
- 前置：安装 Rust 与 wasm-pack
- 构建：
  - Windows：在目录 [wasm-math-demo](file:///d:/Project/summary-monorepo/app/wasm-math-demo) 运行 `build.ps1` 或 `npm run build`
  - macOS/Linux：运行 [build.sh](file:///d:/Project/summary-monorepo/app/wasm-math-demo/build.sh)
- 运行：直接打开 [index.html](file:///d:/Project/summary-monorepo/app/wasm-math-demo/index.html)，无需本地服务

## 目录与关键文件
- 页面与交互：[index.html](file:///d:/Project/summary-monorepo/app/wasm-math-demo/index.html)、[main.js](file:///d:/Project/summary-monorepo/app/wasm-math-demo/main.js)
- Rust 模块： [Cargo.toml](file:///d:/Project/summary-monorepo/app/wasm-math-demo/rust-math/Cargo.toml)、[lib.rs](file:///d:/Project/summary-monorepo/app/wasm-math-demo/rust-math/src/lib.rs)
- 构建脚本： [build.ps1](file:///d:/Project/summary-monorepo/app/wasm-math-demo/build.ps1)、[build.sh](file:///d:/Project/summary-monorepo/app/wasm-math-demo/build.sh)、[package.json](file:///d:/Project/summary-monorepo/app/wasm-math-demo/package.json)

## 功能简介
- 阶乘对比：JS 迭代 vs JS 递归 vs WASM 迭代 vs WASM 递归
- 矩阵乘法：WASM 计算与 JS 基线对比（小规模下对比，演示跨边界开销）
- 错误处理：参数校验、try/catch 包裹、状态栏提示

## 架构与数据流
- 加载：浏览器加载 wasm-pack 生成的 ESM 包 `pkg/rust_math.js`，调用默认 `init()` 完成 WASM 初始化
- 交互：按钮触发 JS 侧收集参数 → 调用 WASM 导出函数 → 输出结果与耗时
- 数据：使用扁平数组（行优先）在 JS 与 WASM 间传递矩阵，减少对象转换开销

## 学习掌握讲解
- 基础掌握
  - 了解 WASM 的目标与优势：快、沙箱、安全、可移植
  - 清楚 JS↔WASM 的交互方式：导出函数、TypedArray/Vec 传参、初始化流程
  - 能独立完成 wasm-pack 构建并在浏览器加载运行
- 进阶掌握
  - 批量数据传输：减少跨边界调用次数，避免热点在 JS/WASM 往返
  - 内存模型：线性内存、扁平布局（矩阵/图像），理解与 DOM/对象的隔离
  - 错误定位：使用 DevTools Performance/Network，结合 `console_error_panic_hook`（可选）定位异常
- 实操练习
  - 修改 [lib.rs](file:///d:/Project/summary-monorepo/app/wasm-math-demo/rust-math/src/lib.rs) 增加新算法（如向量点积/卷积）
  - 在 [main.js](file:///d:/Project/summary-monorepo/app/wasm-math-demo/main.js) 中增加新按钮并度量耗时
  - 将矩阵维度扩大并观察 JS 与 WASM 的性能拐点与瓶颈位置

## 性能与内存优化要点
- 迭代优先：在 JS/WASM 中迭代通常优于递归，避免栈溢出与函数开销
- 批量调用：尽量把数据打包一次传递到 WASM，减少边界往返
- 扁平数组：按行存储的 Float64/Float32 一维数组在 WASM 中效率更高
- 视情况降精度：图像/矩阵可考虑 Float32，以提升速度与降低内存占用

## 调试与排错
- 浏览器 DevTools：Network 面板查看 .wasm 加载；Performance 面板捕获长任务与热点
- 参数校验：范围检查与错误提示，避免异常输入导致崩溃
- 错误输出：统一在状态栏显示并打印控制台日志，确保可观察性

## 扩展方向
- 图像滤镜：加入高斯模糊/锐化函数，传入像素数组在 WASM 侧处理
- 加密算法：接入 Rust 的哈希库（如 blake3），对比 JS 实现
- Worker 集成：将繁重计算放入 Web Worker，减少主线程阻塞
- 框架集成：封装为 React/Vue 组件，按需加载与并发计算

## 常见问题
- wasm-pack 未安装：参考官方安装器（支持 Windows/macOS）
- 权限与路径：Windows 可能需要 PowerShell 执行策略设为 Bypass
- 跨域：本 Demo 直接本地文件打开即可；若引入远程资源需注意 CORS

## 许可与致谢
- 语言与工具：Rust、wasm-pack
- 前端宿主：浏览器 ESM 与 DevTools

