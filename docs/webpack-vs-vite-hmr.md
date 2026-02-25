# Webpack 与 Vite 热更新 (HMR) 原理深度解析

## 核心结论

**是的，Webpack 和 Vite 的热更新（HMR）都需要通过 WebSocket 来通知浏览器。**

虽然它们都使用 WebSocket 作为服务器向浏览器推送更新信号的桥梁，但在收到信号后，**浏览器获取新代码的方式**和**替换模块的逻辑**有着本质的区别。

---

## 一、Webpack HMR 原理深度解析

Webpack 的热更新是基于 **Bundle（打包）** 的。

### 1. 核心流程图解

1.  **启动阶段**：
    *   Webpack Compiler 将项目打包，生成 Bundle。
    *   启动 `webpack-dev-server`，建立 WebSocket 服务。
    *   在浏览器端注入 HMR Runtime（客户端代码）。

2.  **更新阶段** (当修改 `src/title.js` 时)：
    *   **文件监听**：Webpack 监听到文件变化。
    *   **重新编译**：Webpack 对受影响的模块进行重新编译。
    *   **生成补丁**：Webpack 生成两个补丁文件：
        *   `manifest.json` (描述哪些模块变了)
        *   `update-chunk.js` (包含新的模块代码)
    *   **WebSocket 通知**：Server 通过 WebSocket 发送消息：`{ type: 'hash', data: '新hash' }` 和 `{ type: 'ok' }`。
    *   **浏览器响应**：
        *   Client 收到消息，对比 Hash。
        *   通过 JSONP 请求下载 `manifest.json` 和 `update-chunk.js`。
    *   **模块替换**：
        *   HMR Runtime 找出过期的模块。
        *   执行新的模块代码。
        *   利用 `module.hot.accept` 冒泡机制，尝试更新依赖该模块的父模块，直到更新成功或刷新页面。

### 2. 关键特点
*   **全量构建依赖图**：修改一个文件，Webpack 需要重新分析依赖图，虽然有缓存，但计算量依然随着项目规模增加。
*   **更新产物**：JSONP 脚本（补丁包）。
*   **复杂度**：O(n) - 更新速度与项目总模块数相关。

---

## 二、Vite HMR 原理深度解析

Vite 的热更新是基于 **Native ESM（原生模块）** 的。

### 1. 核心流程图解

1.  **启动阶段**：
    *   启动 Vite Server（基于 Connect/Koa）。
    *   **不打包**：直接启动服务器，不需要分析整个依赖图。
    *   建立 WebSocket 服务。
    *   在 HTML 中注入 `@vite/client` 脚本。

2.  **更新阶段** (当修改 `src/title.vue` 时)：
    *   **文件监听**：Vite Server 监听到文件变化。
    *   **模块图分析**：Vite 只需要分析该文件的直接依赖链（Module Graph），找到 HMR 边界。
    *   **单文件编译**：利用 **esbuild** 毫秒级编译该文件（如 `.vue` -> `.js`）。
    *   **WebSocket 通知**：Server 发送精确的消息：
        ```json
        {
          "type": "update",
          "updates": [
            { "type": "js-update", "path": "/src/title.vue", "acceptedPath": "/src/title.vue", "timestamp": 123456 }
          ]
        }
        ```
    *   **浏览器响应**：
        *   `@vite/client` 收到消息。
        *   利用原生 `import()` 重新请求该文件：`import('/src/title.vue?t=123456')`。
    *   **模块替换**：
        *   浏览器下载并执行新的 ESM 模块。
        *   Vite Client 替换旧模块，并触发 Vue/React 组件的重新渲染。

### 2. 关键特点
*   **按需编译**：只编译当前修改的文件，不关心其他 99% 的文件。
*   **更新产物**：原生 ESM 模块文件。
*   **复杂度**：O(1) - 更新速度始终是毫秒级，与项目大小无关。
*   **浏览器分担**：模块解析和加载由浏览器 Native ESM 处理，服务器只管“送货”。

---

## 三、对比总结

| 特性 | Webpack HMR | Vite HMR |
| :--- | :--- | :--- |
| **通信机制** | WebSocket | WebSocket |
| **更新粒度** | **Chunk (代码块)**：通常是一个包含多个模块的补丁包 | **Module (单文件)**：精确到单个文件的原生 ESM |
| **服务器负载** | **重**：需要重新构建依赖图、生成补丁包 | **轻**：只需转译单个文件，无需打包 |
| **浏览器行为** | JSONP 加载补丁脚本 -> 运行时执行 -> 替换模块 | 动态 `import()` 重新请求文件 -> 浏览器原生加载 -> 替换模块 |
| **随着项目变大** | 更新速度变慢 (O(n)) | 更新速度不变 (O(1)) |
| **底层工具** | Webpack Compiler (JS) | esbuild (Go) + Native ESM |

### 为什么 Vite 更快？
1.  **No-Bundle**：省去了最耗时的“打包”过程。
2.  **Esbuild**：利用 Go 语言的高性能进行单文件转译。
3.  **浏览器算力**：利用现代浏览器的模块解析能力，分担了服务器的压力。
