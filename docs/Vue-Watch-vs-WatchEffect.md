# Vue 侦听器详解：watch vs watchEffect 与副作用清理

在 Vue 中，侦听器 (Watchers) 是处理副作用（Side Effects）的核心机制。本文档详细解析 `watch` 与 `watchEffect` 的区别，以及如何在它们中正确地进行资源清理。

## 1. 核心对比：watch vs watchEffect

| 维度 | watch | watchEffect |
| :--- | :--- | :--- |
| **依赖来源** | **显式指定** (Source) | **隐式自动收集** (Auto-track) |
| **初始化执行** | **懒执行** (Lazy) <br> 默认不执行，除非配置 `immediate: true` | **立即执行** (Eager) <br> 必须执行一次以收集依赖 |
| **访问旧值** | ✅ 支持 `(newVal, oldVal)` | ❌ 不支持 (只知道变了) |
| **心智模型** | "当 X 变化时，执行 Y" | "执行这段逻辑，并自动响应其中数据的变化" |
| **React 对应** | `useEffect(..., [deps])` | 无直接对应 (类似 MobX 的 autorun) |

### 1.1 代码示例

**watch (精确控制):**
```javascript
const id = ref(1);

watch(id, async (newId, oldId) => {
  console.log(`ID changed from ${oldId} to ${newId}`);
  // 只有 id 变了才请求
  await fetchUser(newId);
});
```

**watchEffect (自动追踪):**
```javascript
const id = ref(1);
const type = ref('admin');

watchEffect(async () => {
  // 自动追踪 id 和 type
  // 只要其中任何一个变了，就会重新执行
  await fetchUser(id.value, type.value);
});
```

---

## 2. 副作用清理 (Side Effect Cleanup)

当侦听器**重新运行**或者**停止**（组件卸载）时，我们需要清理上一次的副作用（如定时器、未完成的请求）。

### 2.1 误区：不支持 return 清理函数
**注意：Vue 的 `watch` 回调不支持像 React `useEffect` 那样通过 `return () => {}` 来清理。**

```javascript
// ❌ 错误写法：Vue 会忽略这个返回值
watch(id, () => {
  const timer = setInterval(...)
  return () => clearInterval(timer); // 不起作用！
});
```

### 2.2 正确写法：onCleanup 参数
Vue 通过回调函数的第三个参数（`watchEffect` 是第一个参数）注入 `onCleanup` 函数。

```javascript
// watch 写法
watch(id, (newId, oldId, onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/${newId}`, { signal: controller.signal });

  // 注册清理回调
  onCleanup(() => {
    // 1. id 变化，重新执行前调用
    // 2. 组件卸载时调用
    controller.abort(); 
  });
});

// watchEffect 写法
watchEffect((onCleanup) => {
  const timer = setInterval(() => console.log('tick'), 1000);

  onCleanup(() => {
    clearInterval(timer);
  });
});
```

### 2.3 Vue 3.5+ 新特性：onWatcherCleanup
为了解决 `async` 函数中难以访问 `onCleanup` 参数的问题（因为 await 之后作用域可能变了或者层级太深），Vue 3.5 引入了全局 API。

```javascript
import { watch, onWatcherCleanup } from 'vue';

watch(id, async (newId) => {
  const controller = new AbortController();
  
  // 可以直接在函数体任意位置调用，无需从参数获取
  onWatcherCleanup(() => {
    controller.abort();
  });

  await fetch(`/api/${newId}`, { signal: controller.signal });
});
```

## 3. 最佳实践建议

1.  **首选 `watch`**：当你需要精确控制依赖，或者需要访问旧值时。
2.  **慎用 `watchEffect`**：虽然它方便，但如果代码逻辑复杂，很容易不小心引入了意料之外的依赖（比如你在 `if` 分支里读了一个 ref），导致频繁触发。
3.  **务必清理**：凡是涉及定时器、DOM 事件监听、网络请求的，一定要使用 `onCleanup`，防止内存泄漏和竞态问题。
