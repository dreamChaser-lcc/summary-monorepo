# 批处理与强制更新：Vue vs React

在前端框架中，频繁的 DOM 操作是性能杀手。为了优化性能，Vue 和 React 都采用了**异步批处理 (Batching)** 策略。本文档详细解析其原理以及如何使用“逃生舱” (`nextTick`, `flushSync`) 来处理特殊场景。

## 1. 为什么需要批处理？

想象一下你执行了以下代码：

```javascript
count.value = 1;
count.value = 2;
count.value = 3;
```

如果没有批处理，框架会尝试更新 DOM 三次。这不仅浪费性能，还可能导致中间状态的 UI 闪烁。
有了批处理，框架会说：“好的，我知道你最后想要的是 3，等一会儿我一次性把 DOM 改成 3。”

---

## 2. Vue 的批处理机制 (Scheduler)

Vue 的更新是**异步**的。

1.  **侦测变化**：当你修改数据 (`state.count++`)，Setter 被触发。
2.  **推入队列**：Vue 不会立即执行组件的渲染函数，而是把这个渲染任务推入一个**调度队列 (Scheduler Queue)**。
3.  **去重**：如果同一个组件被多次触发更新，它只会在队列中出现一次（Set 去重）。
4.  **清空队列**：在当前同步代码执行完毕后（通常利用 Microtask，如 `Promise.resolve`），Vue 会清空队列，执行实际的 DOM 更新。

### Vue 的逃生舱：`nextTick`

如果你需要在数据变化后**立即**操作最新的 DOM，你需要等待 Vue 的异步队列执行完毕。

```javascript
import { nextTick, ref } from 'vue';

const count = ref(0);
const divRef = ref(null);

function update() {
  count.value++;
  // 此时 DOM 还没更新！
  console.log(divRef.value.innerText); // 输出 "0"
  
  // ✅ 使用 nextTick 等待 DOM 更新
  nextTick(() => {
    console.log(divRef.value.innerText); // 输出 "1"
  });
  
  // 或者使用 await (推荐)
  // await nextTick();
}
```

---

## 3. React 的批处理机制 (Automatic Batching)

### React 18 之前 (Legacy)
批处理只在**React 合成事件** (如 `onClick`) 中生效。在 `setTimeout` 或 `fetch` 回调中，每次 `setState` 都会触发重渲染。

### React 18 之后 (Modern)
实现了**全自动批处理**。无论代码在哪里执行（Promise, setTimeout, 原生事件），只要在同一个“事件循环 tick”内，React 都会将多次状态更新合并。

```javascript
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 只会重新渲染一次 (Render: 1)
}

setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18: 只渲染一次
  // React 17: 渲染两次！
}, 1000);
```

### React 的逃生舱：`flushSync`

在极少数情况下，你需要强制 React **立即、同步**地更新 DOM（例如需要立即测量更新后的布局以进行动画）。

```javascript
import { flushSync } from 'react-dom';

function handleClick() {
  // 强制同步更新
  flushSync(() => {
    setCount(c => c + 1);
  });
  // 此时 DOM 已经更新了！
  console.log(divRef.current.innerText);
  
  // 这行代码会在 DOM 更新后才执行
  doSomethingWithNewDOM();
}
```
*注意：`flushSync` 会严重影响性能，因为它破坏了批处理优化，应尽量少用。*

---

## 4. 对比总结

| 特性 | Vue | React (18+) |
| :--- | :--- | :--- |
| **批处理策略** | 总是异步 (Microtask) | 总是异步 (Automatic Batching) |
| **去重机制** | 基于组件 ID (Set) | 基于 Fiber 树的合并 |
| **等待 DOM 更新** | `await nextTick()` | (无直接对应，通常用 `useEffect`) |
| **强制立即更新** | (无官方同步 API，通常靠 nextTick 等待) | `flushSync(() => ...)` |
| **实现原理** | 响应式系统 + 调度器 | 调度器 (Scheduler) + Fiber |

**核心区别**：
*   Vue 提供了 `nextTick` 让你**“排队等待”** DOM 更新。
*   React 提供了 `flushSync` 让你**“插队强制”** DOM 更新。
