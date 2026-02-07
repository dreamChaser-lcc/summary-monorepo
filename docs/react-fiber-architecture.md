# React Fiber 架构详解

**Fiber** 是 React 16 引入的全新核心算法架构，它的出现主要是为了解决 React 15 在处理大型应用时的**性能瓶颈**。

## 1. 为什么要引入 Fiber？(React 15 的痛点)

在 React 15 (Stack Reconciler) 中，更新过程是**同步且不可中断**的。
一旦开始渲染，React 就会递归调用组件树，直到整个树都算完。这个过程就像在高速公路上跑一辆无法减速的卡车：

* **卡顿**：如果组件树很大，JS 计算时间超过 16.6ms（1帧），主线程就会被阻塞，导致动画掉帧、输入框不响应。
* **无法插队**：即使有更高优先级的任务（如用户打字），也必须等当前的渲染任务跑完。

## 2. Fiber 是什么？

Fiber 可以理解为**“纤程”**或者**“协程”**。在 React 中，它有三层含义：

1. **架构层面**：一套新的协调引擎，支持**异步、可中断、可恢复**的渲染。
2. **数据结构层面**：一个 Fiber 就是一个 JavaScript 对象，代表 Virtual DOM 树中的一个节点。它包含了自己的状态、副作用以及指向父/子/兄弟节点的指针。
3. **工作单元层面**：Fiber 是 React 任务调度的最小单位。

## 3. Fiber 的核心数据结构

传统的 VDOM 是树形结构（递归遍历），而 Fiber 树是一个**链表结构**。
这使得 React 可以随时暂停遍历，并在之后找到原来的位置继续遍历。

```javascript
const fiber = {
  // 1. 实例相关
  tag: 1, // 组件类型 (Function/Class/Host...)
  type: App, // 组件函数本身
  stateNode: null, // 真实 DOM 或组件实例

  // 2. 链表树结构 (关键！)
  return: parentFiber, // 指向父节点
  child: childFiber,   // 指向第一个子节点
  sibling: siblingFiber, // 指向右边的兄弟节点

  // 3. 工作相关
  pendingProps: {}, // 新的 props
  memoizedProps: {}, // 旧的 props
  updateQueue: null, // 状态更新队列

  // 4. 副作用相关
  flags: Placement, // 标记要做什么操作 (插入/删除/更新)
  nextEffect: null, // 下一个有副作用的 Fiber
}
```

## 4. Fiber 的工作原理：时间切片 (Time Slicing)

Fiber 架构将渲染过程拆分为两个阶段：

### 4.1 Render Phase (渲染阶段 - 可中断)

* **任务**：遍历 Fiber 树，对比新旧 props，确定哪些节点需要更新，打上标记 (Flags)。
* **机制**：
  * React 会向浏览器申请“时间片”（默认 5ms）。
  * 在每个时间片内，React 执行一个或多个 Fiber 单元（Unit of Work）。
  * 每做完一个单元，React 就会看一眼：“还有时间吗？有高优先级任务吗？”
  * **没时间了/有急事** -> **暂停**当前工作，把主线程还给浏览器。
  * **空闲了** -> **恢复**之前的进度继续做。

### 4.2 Commit Phase (提交阶段 - 不可中断)

* **任务**：根据 Render 阶段生成的“副作用链”，一次性修改真实的 DOM。
* **机制**：为了防止页面闪烁，这个阶段必须**同步执行**，不能被打断。

## 5. 任务调度实现方案 (Scheduler)

React 并没有使用浏览器原生的 `requestIdleCallback` 来实现时间切片，而是自己实现了一个 **Scheduler (调度器)**。

### 5.1 为什么不用 `requestIdleCallback`?

1. **兼容性问题**：在 React 16 发布时，`requestIdleCallback` 的浏览器支持度并不好（Safari 至今支持不佳）。
2. **触发频率不稳定**：`requestIdleCallback` 只有在浏览器**非常空闲**时才会触发。如果浏览器一直很忙（比如有 CSS 动画），React 的更新任务可能会被无限期推迟（饿死）。
3. **刷新率限制**：`requestIdleCallback` 通常限制在每秒 20 次（50ms），这对于追求 60fps（16.6ms）的高性能应用来说太慢了。

### 5.2 React 的替代方案：MessageChannel + postMessage

React 最终选择使用 **`MessageChannel`** 配合 `postMessage` 来模拟一个**“零延迟的宏任务”**。

* **实现原理**：
    1. React 创建一个 `MessageChannel`。
    2. 当需要调度任务时，调用 `port2.postMessage(null)`。
    3. 因为 `postMessage` 是宏任务，它会让出主线程，允许浏览器先进行 UI 渲染。
    4. 浏览器渲染完后，立刻执行 `port1.onmessage` 回调，React 继续干活。
* **优势**：
  * **比 setTimeout(0) 更快**：`setTimeout` 有 4ms 的最小延迟限制，而 `postMessage` 几乎没有延迟。
  * **精确控制**：React 可以自己控制每个时间片的大小（默认 5ms），而不是被动等待浏览器空闲。

## 6. 双缓存机制 (Double Buffering)

Fiber 架构在内存中同时维护两棵树：

1. **current 树**：当前屏幕上显示的内容对应的 Fiber 树。
2. **workInProgress 树**：正在内存中构建的、即将更新的 Fiber 树。

* **更新流程**：
  * 当状态改变时，React 在 `workInProgress` 树上进行计算和复用。
  * 计算完成后，进入 Commit 阶段。
  * DOM 更新完毕后，React 只需要把根节点的指针从 `current` 切换到 `workInProgress`。
  * 原来的 `current` 变成了闲置树，等待下一次更新时被复用。

## 7. 总结

Fiber 架构的核心价值在于：**把“一气呵成”的同步递归，变成了“化整为零”的异步链表遍历**。

* **更流畅**：利用时间切片，避免长任务阻塞主线程。
* **更智能**：支持任务优先级（Priority），可以让用户交互（点击/输入）优先于数据加载。
* **更灵活**：为 Concurrent Mode（并发模式）和 Suspense 打下了基础。
