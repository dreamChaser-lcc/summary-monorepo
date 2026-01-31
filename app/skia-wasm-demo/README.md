# Skia-WASM Demo

这个项目演示了如何使用 Google Skia 图形引擎的 WebAssembly 版本 (CanvasKit) 在浏览器中进行高性能渲染。

## WebAssembly (WASM) 在哪里？

在这个 Demo 中，WebAssembly 扮演了核心渲染引擎的角色，但它对开发者是透明的。

1.  **加载机制**:
    - 项目没有包含本地 `.wasm` 文件，而是通过 CDN 加载。
    - 在 `main.js` 中，`CanvasKitInit` 函数会请求 `https://unpkg.com/canvaskit-wasm@0.39.1/bin/canvaskit.wasm`。
    - 这是一个约 6MB (gzip 后更小) 的二进制文件，包含了编译好的 Skia C++ 引擎。

2.  **工作原理**:
    - **JavaScript (main.js)**: 作为控制层，负责逻辑处理和 API 调用。
    - **WebAssembly (Skia)**: 作为执行层。当你调用 `canvas.drawRect()` 时，JS 实际上是向 WASM 内存发送指令。
    - **WebGL**: Skia 最终将绘制指令转换为 WebGL 调用，由 GPU 完成渲染。

## 为什么这么做？

- **性能**: Skia 的 C++ 实现比纯 JS Canvas API 更高效，特别是在处理复杂的路径、大量的几何体变换时。
- **一致性**: 可以在 Web 端获得与 Android/Chrome/Flutter 完全一致的渲染效果。
- **功能**: 提供了许多原生 Canvas API 不具备的高级功能（如 Lottie 动画支持、高级文本排版、自定义着色器 SkSL）。

## 运行 Demo

直接在浏览器打开 `index.html` 即可（建议使用 Live Server 以避免跨域问题）。
Demo 展示了两种渲染模式：
1.  **Naive Loop**: 传统的 JS 循环调用绘制，性能受限于 JS 与 WASM 的通信开销。
2.  **Vertices API**: 使用 Skia 的顶点 API 批量提交数据，大幅减少跨语言调用，性能极高。

## 概念问答（WebAssembly & Skia）

### WebAssembly 是什么？一定要用 Rust 吗？
- WebAssembly（WASM）是通用“编译目标”，不是编程语言；可以用 Rust、C/C++、AssemblyScript、TinyGo、Zig 等编译到 `.wasm`。
- Rust 常被推荐因为工具链成熟（wasm-pack、wasm-bindgen）、类型安全、性能好、与 JS 互操作体验优。
- 在本仓库还提供了一个基于 Rust 的 WASM 数学演示，参考 [wasm-math-demo](file:///d:/Project/summary-monorepo/app/wasm-math-demo/README.md)。

### WebAssembly 和 WebWorker 的关系与差异？
- WebAssembly：高性能“二进制模块”，在当前线程执行（主线程或 Worker 线程皆可），负责密集计算。
- WebWorker：额外的 JS 线程环境，把任务搬到后台以避免阻塞 UI，不直接提升单次计算速度。
- 最佳实践：在 Worker 中加载 WASM，既快又不阻塞主线程。

### 本 Demo 中 WebAssembly 的作用体现在哪里？
- 我们使用 CanvasKit（Skia 的 WASM 版本）作为底层渲染引擎，通过 `CanvasKitInit` 加载 `.wasm`：
  - 代码位置：[main.js](file:///d:/Project/summary-monorepo/app/skia-wasm-demo/main.js)
  - 通过 `locateFile` 从 CDN 加载 `canvaskit.wasm`，并在状态栏与控制台输出加载信息。
- JS 负责生成顶点/文本并发起绘制调用；WASM（Skia）在沙箱内完成复杂图形计算并通过 WebGL/GPU 渲染。

### Skia 是什么？和 CanvasKit 有何关系？
- Skia 是 Google 开源的跨平台 2D 图形渲染引擎（C++），Chrome、Android、Flutter 等都在使用它。
- CanvasKit 是“Skia 编译到 WebAssembly”的版本，让浏览器也能直接使用 Skia 的 API。
- 本 Demo：初始化 Skia（WASM）→ 创建绘图表面（Surface）→ 使用 `SkPaint`/`SkCanvas` 绘制矩形、顶点与文本。参考 [main.js](file:///d:/Project/summary-monorepo/app/skia-wasm-demo/main.js)、[index.html](file:///d:/Project/summary-monorepo/app/skia-wasm-demo/index.html)。

### 何时选用 Skia/CanvasKit？
- 需要跨平台一致的渲染效果（Web、桌面、移动）。
- 需要高性能复杂路径、文本排版、滤镜等图形能力，又不想自己写底层 WebGL/WebGPU 着色器。

### 附加：JS 循环 vs 递归（与性能相关）
- 在浏览器端大规模任务中，JS 的循环通常优于递归：避免栈溢出与函数调用开销，易被引擎优化。
- 本 Demo 在生成与绘制大量单元格/顶点时采用迭代循环，以减少 JS 端开销。

### 扩展建议
- 将顶点构建或文本布局挪到 WebWorker，以进一步减少主线程阻塞。
- 在 CanvasKit 的基础上尝试 SkSL 着色器或图像滤镜，探索更丰富的图形能力。
