# Vue 自定义渲染器 (Custom Renderer) 详解

Vue 3 引入了强大的自定义渲染器 API (`createRenderer`)，这使得 Vue 的核心特性（响应式系统、组件化、Diff 算法）可以与具体的渲染平台解耦。

默认情况下，我们使用的 Vue 是基于浏览器的 DOM 渲染器 (`@vue/runtime-dom`)。但通过自定义渲染器，我们可以将 Vue 应用到任何环境，比如 Canvas、WebGL、原生移动应用甚至命令行终端。

## 1. 核心概念

Vue 的架构分为两层：
1.  **Runtime Core (核心运行时)**: 包含响应式系统、虚拟 DOM、组件生命周期等与平台无关的逻辑。
2.  **Runtime DOM / Custom Renderer (渲染层)**: 负责将虚拟节点 (VNode) 转换为真实的平台元素（如 DOM 节点、Canvas 对象等）。

自定义渲染器的作用就是替换默认的 DOM 渲染逻辑，实现一套新的“节点操作”规则。

## 2. 核心 API: `createRenderer`

要创建自定义渲染器，我们需要从 `@vue/runtime-core` 导入 `createRenderer`，并传入一个配置对象。这个对象包含了两类关键方法：

1.  **Node Ops (节点操作)**: 如何创建、插入、删除、查找节点。
2.  **Patch Prop (属性更新)**: 如何更新节点的属性、事件、样式。

```typescript
import { createRenderer } from '@vue/runtime-core'

const renderer = createRenderer({
  // --- 节点操作 (NodeOps) ---
  createElement(type) { /* 创建元素 */ },
  createText(text) { /* 创建文本 */ },
  insert(el, parent, anchor) { /* 插入元素 */ },
  remove(el) { /* 删除元素 */ },
  parentNode(node) { /* 获取父节点 */ },
  nextSibling(node) { /* 获取兄弟节点 */ },

  // --- 属性更新 (PatchProp) ---
  patchProp(el, key, prevValue, nextValue) {
    // 处理 props, class, style, events 等
  }
})

// 使用自定义渲染器创建应用
export const createApp = renderer.createApp
```

## 3. 实战示例：Canvas 渲染器

下面我们实现一个简单的渲染器，它不操作 DOM，而是操作纯 JavaScript 对象，最终在一个 Canvas 上绘制出来。

### 3.1 定义渲染器逻辑

```javascript
// canvas-renderer.js
import { createRenderer } from 'vue'

// 1. 定义节点操作
const nodeOps = {
  createElement(type) {
    // 返回一个轻量级的对象，描述图形
    return {
      type,
      x: 0, y: 0, w: 0, h: 0, fill: 'transparent',
      children: [] // 模拟子节点结构
    }
  },
  insert(el, parent) {
    // 将子节点添加到父节点的 children 数组中
    parent.children.push(el)
  },
  remove(el) {
    // 从父节点移除（这里简化处理，实际需要找到 parent）
  },
  createText(text) {
    // Canvas 暂时不支持纯文本节点，返回空对象或特定结构
    return { type: 'text', text }
  },
  parentNode: () => null,
  nextSibling: () => null,
  setElementText: () => {}
}

// 2. 定义属性更新
const patchProp = (el, key, prevValue, nextValue) => {
  // 当 Vue 响应式数据变化时，会调用此方法更新属性
  el[key] = nextValue
}

// 3. 创建渲染器
const renderer = createRenderer({
  ...nodeOps,
  patchProp
})

// 4. 导出自定义的 createApp
export const createApp = (rootComponent) => {
  return renderer.createApp(rootComponent)
}
```

### 3.2 使用自定义渲染器

```javascript
// main.js
import { createApp } from './canvas-renderer'
import App from './App.vue'

// 准备 Canvas 上下文
const canvas = document.getElementById('app')
const ctx = canvas.getContext('2d')

// 定义根容器（不是 DOM，而是我们渲染树的根）
const rootContainer = {
  type: 'root',
  children: []
}

// 挂载应用
const app = createApp(App)
app.mount(rootContainer)

// --- 渲染循环 (Game Loop) ---
// 因为我们需要不断重绘 Canvas，所以需要一个循环
function draw() {
  // 1. 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 2. 递归绘制节点树
  function drawNode(node) {
    if (node.type === 'rect') {
      ctx.fillStyle = node.fill
      ctx.fillRect(node.x, node.y, node.w, node.h)
    }
    // 继续绘制子节点
    if (node.children) {
      node.children.forEach(drawNode)
    }
  }

  // 从根容器开始绘制
  rootContainer.children.forEach(drawNode)
  
  requestAnimationFrame(draw)
}

draw()
```

### 3.3 组件写法

现在，你可以在 `.vue` 文件中写“Canvas 组件”了：

```vue
<!-- App.vue -->
<template>
  <!-- 注意：这里的 rect 不是 SVG，而是我们自定义的 type -->
  <rect 
    :x="x" 
    :y="y" 
    w="100" 
    h="100" 
    fill="red" 
    @click="move"
  />
</template>

<script setup>
import { ref } from 'vue'

const x = ref(10)
const y = ref(10)

// 简单的动画逻辑
const move = () => {
  x.value += 10
}
</script>
```

## 4. 应用场景

自定义渲染器的应用场景非常广泛，主要用于将 Vue 的开发体验（声明式、组件化、响应式）带入非 DOM 环境。

1.  **跨端开发 (Cross-Platform)**
    *   **Uni-app / Taro**: 将 Vue 组件渲染为微信小程序原生组件、iOS/Android 原生控件。
    *   **NativeScript-Vue**: 直接渲染为原生移动 UI 组件。

2.  **图形与 3D (Graphics & 3D)**
    *   **TresJS (Three.js)**: 允许使用 `<TresMesh>` 等组件构建 3D 场景，属性自动响应式更新。
    *   **VueGL**: WebGL 的 Vue 封装。
    *   **Canvas 游戏引擎**: 使用 Vue 管理游戏状态和 UI。

3.  **文档生成**
    *   **Vue-PDF-Renderer**: 将 Vue 组件渲染为 PDF 文档结构。
    *   **Vue-TermUI**: 将 Vue 组件渲染为命令行界面 (TUI)，构建复杂的 CLI 工具。

4.  **自定义输出**
    *   生成 JSON 树、XML 结构或其他特定格式的数据流。

## 5. 总结

Vue 的自定义渲染器赋予了开发者“上帝视角”，让你不再局限于浏览器的 DOM。

*   **优点**:
    *   **复用生态**: 可以复用 Vue 的路由、状态管理 (Pinia) 和组件逻辑。
    *   **开发体验**: 享受声明式编程和响应式数据带来的便利。
    *   **解耦**: 核心逻辑与渲染目标分离，易于测试和移植。

*   **缺点**:
    *   需要对目标平台（如 Canvas API 或 WebGL）有深入了解。
    *   不支持标准的 DOM API（如 `document.getElementById`），需要自己处理事件系统。
