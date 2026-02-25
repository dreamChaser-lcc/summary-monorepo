# Vite `import.meta.glob` 深度解析与 Webpack `require.context` 对比

## 核心概念

**`import.meta.glob`** 是 Vite 专有的一个功能函数，用于**批量导入**文件系统中的模块。

它基于 ESM 规范，利用 glob 模式匹配文件，并生成对应的导入映射。这在需要自动化注册路由、组件、Vuex/Pinia 模块或加载多语言包时非常有用。

---

## 一、`import.meta.glob` 详解

### 1. 基础用法：懒加载 (Lazy Loading)

这是默认行为。Vite 会将匹配到的文件转换为**动态导入函数** (`() => import(...)`)。

*   **代码示例**：
    ```javascript
    const modules = import.meta.glob('./dir/*.js');
    ```

*   **编译结果 (Virtual)**：
    ```javascript
    const modules = {
      './dir/foo.js': () => import('./dir/foo.js'),
      './dir/bar.js': () => import('./dir/bar.js')
    };
    ```

*   **使用场景**：路由懒加载。
    ```javascript
    // Vue Router 示例
    const routes = Object.keys(modules).map((path) => {
      return {
        path: path.replace('./dir', '').replace('.js', ''),
        component: modules[path] // 直接作为 component，Vue Router 会自动处理 Promise
      };
    });
    ```

### 2. 进阶用法：直接导入 (Eager Loading)

如果你想**同步**导入所有模块（类似 `import ... from ...`），需要加上 `{ eager: true }`。

*   **代码示例**：
    ```javascript
    const modules = import.meta.glob('./dir/*.js', { eager: true });
    ```

*   **编译结果 (Virtual)**：
    ```javascript
    import * as __glob__0_0 from './dir/foo.js';
    import * as __glob__0_1 from './dir/bar.js';

    const modules = {
      './dir/foo.js': __glob__0_0,
      './dir/bar.js': __glob__0_1
    };
    ```

*   **使用场景**：注册全局组件、Vuex/Pinia 模块初始化。
    ```javascript
    // 注册所有全局组件
    for (const path in modules) {
      const component = modules[path].default;
      app.component(component.name, component);
    }
    ```

### 3. 指定导入格式 (Import As)

你可以通过 `as` 或 `query` 参数控制导入的内容格式。

*   **导入资源 URL** (`as: 'url'`)：
    适用于批量导入图片路径。
    ```javascript
    const images = import.meta.glob('./assets/*.png', { eager: true, as: 'url' });
    // images: { './assets/logo.png': '/src/assets/logo.png', ... }
    ```

*   **导入原始字符串** (`as: 'raw'`)：
    适用于导入 SVG 源码、Markdown 文本或 Shader 代码。
    ```javascript
    const svgs = import.meta.glob('./icons/*.svg', { eager: true, as: 'raw' });
    // svgs: { './icons/home.svg': '<svg>...</svg>', ... }
    ```

### 4. 多重匹配与排除

支持数组语法，可以同时匹配多个模式或排除特定文件。

```javascript
// 匹配所有 .js 和 .ts，但排除 .test.js
const modules = import.meta.glob(['./dir/*.{js,ts}', '!./dir/*.test.js']);
```

---

## 二、与 Webpack `require.context` 对比

如果你正在从 Webpack 迁移到 Vite，这是最常见的痛点。

| 特性 | Webpack `require.context` | Vite `import.meta.glob` |
| :--- | :--- | :--- |
| **模块规范** | CommonJS / Webpack 专有 | ESM / Vite 专有 |
| **加载方式** | **同步 (Sync)**：返回一个 require 函数 | **默认异步 (Lazy)**，可选同步 (Eager) |
| **语法风格** | 函数调用：`require.context(dir, useSubdirectories, regExp)` | 对象字面量 + Glob 字符串：`import.meta.glob('./dir/**/*.js')` |
| **遍历方式** | `context.keys().map(context)` | `for (const path in modules)` |
| **类型支持** | 较弱，通常返回 `any` | 较好，泛型支持 `Record<string, () => Promise<T>>` |

### 迁移指南

#### 场景：同步导入所有 Vue 组件

**Webpack 写法**：
```javascript
const requireComponent = require.context('./components', false, /\.vue$/);

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName);
  const componentName = fileName.replace(/^\.\/(.*)\.\w+$/, '$1');
  
  Vue.component(componentName, componentConfig.default || componentConfig);
});
```

**Vite 写法**：
```javascript
// 1. 使用 glob 匹配文件
// 2. { eager: true } 模拟 require.context 的同步行为
const modules = import.meta.glob('./components/*.vue', { eager: true });

for (const path in modules) {
  const componentConfig = modules[path];
  // 从路径提取组件名 (例如 ./components/Button.vue -> Button)
  const componentName = path.split('/').pop().replace(/\.\w+$/, '');
  
  app.component(componentName, componentConfig.default || componentConfig);
}
```

---

## 三、底层原理

1.  **静态分析**：Vite 的插件（`vite:import-glob`）在构建阶段（不管是 Dev Server 还是 Build）会扫描源代码。
2.  **AST 转换**：当遇到 `import.meta.glob` 语法时，它会解析 Glob 模式。
3.  **文件系统扫描**：使用 `fast-glob` 库扫描匹配的文件列表。
4.  **代码重写**：将原始代码替换为生成的 JS 对象（包含 import 语句或动态 import 函数）。

**注意**：因为依赖于静态分析，`import.meta.glob` 的参数必须是**字符串字面量**（或字面量数组），**不能是变量**。

```javascript
// ❌ 错误：Vite 无法在构建时知道 dir 变量是什么
const dir = './components';
import.meta.glob(`${dir}/*.vue`);

// ✅ 正确：保持 glob 模式静态
import.meta.glob('./components/*.vue');
```
