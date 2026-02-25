# Rollup Tree Shaking 原理深度解析与 Webpack 对比

## 核心概念：什么是 Tree Shaking？

**Tree Shaking（摇树优化）** 是一个术语，通常用于描述移除 JavaScript 上下文中未引用的代码（Dead Code）。

想象你的应用程序是一棵树：
*   **绿色叶子**：实际使用的代码（Live Code）。
*   **枯黄叶子**：引入了但未使用的代码（Dead Code）。

打包工具的任务就是“摇晃”这棵树，让枯黄的叶子掉下来，只保留绿色的活体代码。

---

## 一、Rollup 的 Tree Shaking 机制 (静态分析 + Scope Hoisting)

Rollup 是 Tree Shaking 概念的**首创者**和**推广者**。它的实现依赖于 ES Module (ESM) 的静态结构特性。

### 1. 静态分析 (Static Analysis)
ES6 模块的 `import` 和 `export` 语句必须位于模块顶层，且模块名只能是字符串常量。这意味着：
*   **确定性**：依赖关系在代码运行前（编译时）就能完全确定。
*   **不可变**：无法像 CommonJS 那样动态导入 (`if (flag) require('a')`)。

Rollup 利用这一特性，在构建阶段生成一个 **Module Graph (模块图)**：
1.  **解析 (Parse)**：使用 Acorn 解析代码生成 AST (抽象语法树)。
2.  **标记 (Mark)**：从入口文件 (`entry`) 开始，追踪所有的 `import` 和 `export`。
    *   它会标记所有**被使用**的变量、函数和类。
    *   它会忽略那些定义了但未被使用的导出。
3.  **包含 (Include)**：只将标记为“使用中”的代码包含在最终的输出 Bundle 中。

### 2. Scope Hoisting (作用域提升) —— 关键差异
这是 Rollup Tree Shaking 效果极佳的核心原因。

*   **机制**：Rollup 会将所有模块的代码“提升”到同一个作用域下（通常是顶层作用域），直接拼接在一起。
*   **效果**：
    *   **扁平化**：消除了模块之间的函数闭包封装（Wrapper Function）。
    *   **无副作用**：因为代码在同一个作用域，未使用的变量声明（`var unused = 1`）如果没被引用，根本不会被写入 Bundle。

**示例**：
```javascript
// math.js
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b; // 未使用

// index.js
import { add } from './math';
console.log(add(1, 2));
```

**Rollup 输出 (Scope Hoisting 后)**：
```javascript
// bundle.js
const add = (a, b) => a + b;
console.log(add(1, 2));
// sub 函数直接消失了，连定义都没有
```

---

## 二、Webpack 的 Tree Shaking 机制 (标记 + 压缩)

Webpack 的 Tree Shaking 实际上是**两步走**策略，它本身只负责“标记”，真正的“移除”交给了压缩工具（Terser）。

### 1. 标记 (Marking)
Webpack 同样利用 ESM 的静态结构进行分析：
*   从入口开始，分析 `import/export`。
*   对于未使用的导出，Webpack 会在生成的 Bundle 中添加一个特殊的注释标记：`/* unused harmony export */`。

### 2. 模块封装 (Module Wrapping) —— 历史包袱
Webpack 为了支持 HMR 和 CommonJS 混用，默认会将每个模块封装在一个函数中：
```javascript
// Webpack Bundle 伪代码
/* 模块 1 */
(function(module, __webpack_exports__, __webpack_require__) {
  __webpack_require__.d(__webpack_exports__, {
    "add": function() { return add; }
    // sub 被标记为 unused，但代码还在里面
  });
  const add = (a, b) => a + b;
  const sub = (a, b) => a - b; 
});
```

### 3. 压缩 (Minification)
只有当启用了 `optimization.minimize: true`（生产模式默认开启）时，**TerserPlugin** 才会介入。
*   Terser 扫描代码，发现 `sub` 函数没有被引用（Dead Code Elimination），才会将其删除。

*注意：Webpack 5 引入了 `ModuleConcatenationPlugin` 来模拟 Scope Hoisting，但在某些复杂场景（如 HMR 开启、多入口共享模块）下会失效，退回到函数封装模式。*

---

## 三、深度对比总结

| 特性 | Rollup Tree Shaking | Webpack Tree Shaking |
| :--- | :--- | :--- |
| **核心机制** | **Scope Hoisting (作用域提升)** | **UsedExports Optimization (标记) + Terser (压缩)** |
| **移除时机** | **打包阶段 (Bundling)**：直接不写入 Bundle | **压缩阶段 (Minification)**：依赖压缩工具移除 |
| **产物形态** | **扁平 (Flat)**：所有代码在同一作用域，无包装函数 | **封装 (Wrapped)**：包含 `__webpack_require__` 等样板代码 |
| **副作用 (Side Effects)** | 处理得非常激进，需要 `package.json` 中的 `sideEffects: false` 辅助 | 相对保守，同样依赖 `sideEffects` 标记 |
| **CommonJS 支持** | 需要插件 (`@rollup/plugin-commonjs`) 转换，Tree Shaking 效果较差 | 原生支持混用，但 CommonJS 导出的代码很难被 Tree Shake |
| **最终效果** | ⭐⭐⭐⭐⭐ (极致干净，适合库) | ⭐⭐⭐⭐ (足够好，适合应用，但有胶水代码) |

## 四、为什么 Rollup 更适合库开发？

1.  **体积更小**：没有 Webpack 的模块加载器（Loader Runtime）和封装函数，对于几 KB 的小库来说，这些样板代码可能比业务代码还大。
2.  **ESM 格式友好**：Rollup 生成的 ESM 产物保留了 `import/export` 结构（如果配置了 `preserveModules`），方便使用者的构建工具（如 Webpack/Vite）再次进行 Tree Shaking。

## 五、如何编写“Tree Shaking 友好”的代码？

无论使用哪个工具，遵循以下原则都能提升优化效果：
1.  **使用 ES Modules**：永远优先使用 `import/export`，避免 `require/module.exports`。
2.  **避免副作用**：不要在模块顶层执行有副作用的代码（如修改全局变量、立即执行函数 IIFE）。
3.  **配置 `sideEffects`**：在 `package.json` 中明确声明 `"sideEffects": false"`，告诉工具“我的代码没有副作用，放心删”。
4.  **导出细粒度**：尽量使用命名导出 (`export const a = 1`)，少用默认导出大对象 (`export default { a: 1 }`)。

---

## 六、深度解析 `sideEffects` (副作用) 配置

`sideEffects` 是 Webpack 4+ 和 Rollup 引入的一个极其重要的优化标记，它决定了打包工具是否可以**大胆地**删除未使用的代码。

### 1. 什么是“副作用” (Side Effect)？

在编程中，副作用是指一个函数或表达式在执行时，除了返回结果外，还对外部环境产生了可观察的影响。

**常见的副作用场景**：
*   **修改全局变量**：`window.foo = 'bar'` 或 `Array.prototype.custom = function() {}`
*   **执行 IIFE (立即执行函数)**：`(function() { console.log('init') })()`
*   **导入 CSS/样式文件**：`import './style.css'` (虽然没有导出变量，但注入了样式)
*   **Polyfill 注入**：`import 'core-js'`

### 2. 为什么需要 `sideEffects` 标记？

打包工具（如 Webpack/Rollup）在进行 Tree Shaking 时，虽然可以通过静态分析发现某个模块的**导出**没有被使用，但它**不敢轻易删除**这个模块。

**举个例子**：
```javascript
// utils.js
console.log('I have a side effect!'); // 副作用：控制台打印
export const add = (a, b) => a + b;

// main.js
import { add } from './utils';
// 假设这里没有调用 add()
```

如果打包工具发现 `add` 没被使用，直接把 `utils.js` 整个删掉，那么 `console.log` 就不会执行了。这可能会破坏程序的逻辑。

但是，如果你的模块是**纯函数库**（如 lodash），没有副作用，那么我们可以显式告诉工具：“放心删，删了不会有影响”。

### 3. 如何配置 `package.json`？

这是最推荐的配置方式，作用于整个 npm 包。

#### 场景一：整个包完全无副作用 (Pure)
如果你的包里全都是纯函数（如 lodash-es, date-fns），直接设为 `false`。
```json
{
  "name": "my-library",
  "sideEffects": false
}
```
**效果**：只要你的库被 `import` 但没被使用导出，打包工具会**直接跳过**整个模块的打包，Tree Shaking 效果最强。

#### 场景二：部分文件有副作用 (Partial)
如果你的包里大部分是纯函数，但包含了一些 CSS 文件或 Polyfill，需要保留它们。
```json
{
  "name": "my-library",
  "sideEffects": [
    "*.css",         // 保留所有 CSS 文件
    "*.less",
    "./src/polyfill.js", // 保留特定的 polyfill 文件
    "**/*.global.js"  // 保留所有以 .global.js 结尾的文件
  ]
}
```
**效果**：打包工具会保留数组中匹配的文件，其他文件如果未被使用则会被 Tree Shaking 移除。

### 4. 最佳实践

1.  **对于库开发者 (Library Author)**：
    *   **务必配置** `sideEffects`！这是你的库能否被高效 Tree Shaking 的关键。
    *   如果是 UI 组件库，记得把样式文件 (`.css`, `.less`, `.scss`) 加入白名单，否则用户引入组件时样式会丢失。
2.  **对于应用开发者 (App Developer)**：
    *   在 Webpack 配置中，`mode: 'production'` 会默认开启 `optimization.sideEffects: true`，它会读取 `package.json` 中的标记。
    *   在处理第三方库时，尽量选择那些支持 ESM 且配置了 `sideEffects: false` 的库（如 `lodash-es` 优于 `lodash`）。
