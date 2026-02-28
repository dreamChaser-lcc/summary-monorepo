# Vue 依赖追踪原理 (vs React)

Vue 的响应式系统是其核心魔法。它实现了**细粒度的自动依赖追踪**，这使得开发者无需像 React 那样手动优化渲染性能。

## 1. 核心原理：Track & Trigger

Vue 的响应式系统建立在三个核心概念之上：

1.  **Reactive Data**: 通过 `Proxy` (Vue 3) 或 `Object.defineProperty` (Vue 2) 劫持的对象。
2.  **Effect (副作用)**: 一个函数，它依赖于某些数据，当数据变化时需要重新执行。最典型的 Effect 就是**组件的渲染函数**。
3.  **Dependency (依赖)**: 每一个响应式属性（如 `state.count`）都有一个专属的 Set 集合，用来存储所有依赖它的 Effect。

### 1.1 流程图解

```mermaid
graph LR
    A[组件渲染] -->|读取数据| B[Getter 拦截]
    B -->|收集依赖 (Track)| C[依赖桶 (Dep Set)]
    D[修改数据] -->|触发更新| E[Setter 拦截]
    E -->|通知依赖 (Trigger)| C
    C -->|重新执行 Effect| A
```

## 2. 代码级原理解析

让我们通过一段模拟代码来看看 Vue 到底在做什么。

```javascript
// 全局变量，指向当前正在执行的 Effect
let activeEffect = null;

// 1. 定义 Effect (观察者)
function effect(fn) {
  activeEffect = fn;
  fn(); // 立即执行一次，触发 getter 进行依赖收集
  activeEffect = null;
}

// 2. 响应式系统 (简易版)
function reactive(target) {
  // 存储依赖的 Map: target -> key -> dep(Set)
  const depsMap = new Map();

  return new Proxy(target, {
    get(obj, key) {
      // TRACK: 如果当前有正在运行的 Effect，把它收集起来
      if (activeEffect) {
        let deps = depsMap.get(key);
        if (!deps) depsMap.set(key, (deps = new Set()));
        deps.add(activeEffect);
        console.log(`[Track] 收集依赖: ${String(key)}`);
      }
      return obj[key];
    },
    set(obj, key, value) {
      obj[key] = value;
      // TRIGGER: 找到依赖这个 key 的所有 Effect，执行它们
      const deps = depsMap.get(key);
      if (deps) {
        console.log(`[Trigger] 数据变化: ${String(key)} -> ${value}`);
        deps.forEach(effectFn => effectFn());
      }
      return true;
    }
  });
}

// 3. 实战演示
const state = reactive({ count: 0, name: 'Alice' });

// 模拟组件渲染
effect(() => {
  console.log(`RENDER: <h1>${state.count}</h1>`);
});
// 输出: 
// [Track] 收集依赖: count
// RENDER: <h1>0</h1>

// 修改数据
state.count = 1;
// 输出:
// [Trigger] 数据变化: count -> 1
// RENDER: <h1>1</h1>

// 修改无关数据
state.name = 'Bob';
// (无输出！因为 effect 函数里没有读取 state.name，所以没收集依赖)
```

## 3. Vue vs React：渲染机制对比

这是面试和架构设计中的核心问题。

### 3.1 Vue: 自动挡 (Push-based)
*   **机制**：Vue 知道**确切的**依赖关系。组件只会在它依赖的数据变化时才更新。
*   **父子组件**：父组件更新，**不会**导致子组件更新（除非 props 变了）。
*   **心智负担**：低。你不需要写 `useMemo` 或 `shouldComponentUpdate`。
*   **缺点**：初始化时的内存开销稍大（因为要为每个属性创建 Dep 对象）。

### 3.2 React: 手动挡 (Pull-based)
*   **机制**：React 不知道谁依赖谁。当状态变化时，React 默认**重新渲染整棵子树**。
*   **父子组件**：父组件渲染 -> **所有**子组件无条件重新渲染。
*   **心智负担**：高。为了性能，你必须手动用 `React.memo`, `useMemo`, `useCallback` 来告诉 React “别瞎动”。
*   **React Compiler (新)**：React 19 试图通过编译器自动加上这些 memo，让 React 也能像 Vue 一样“自动挡”，但其底层逻辑依然是自顶向下的递归比较。

### 总结表

| 特性 | Vue (Fine-grained) | React (Coarse-grained) |
| :--- | :--- | :--- |
| **变更检测** | Proxy 拦截 (Setter) | 比较新旧 VDOM (Diff) |
| **渲染范围** | 精确到组件 (甚至 Block 级别) | 默认整棵子树 |
| **性能优化** | **自动** (依赖追踪) | **手动** (Memoization) |
| **数据流** | 可变 (Mutable) | 不可变 (Immutable) |

Vue 的哲学是：**“机器能做的事，别让人做。”** 依赖追踪就是这一哲学的极致体现。
