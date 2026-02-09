# Immer.js 原理深度解析

Immer.js 是 React 生态中最流行的不可变状态管理库之一。它允许开发者使用 **Mutable (可变)** 的语法来编写 **Immutable (不可变)** 的更新逻辑。

## 一、 核心概念：Copy-on-Write (写时复制)

Immer 的核心思想是 **Copy-on-Write**。当你想要修改一个状态时，Immer 不会直接修改它，而是给你一个“草稿”（Draft）。

1. **Current State**: 当前的状态（不可变）。
2. **Draft State**: 一个代理对象，你可以随意修改它。
3. **Next State**: 根据你在 Draft 上做的修改，Immer 生成的最终不可变状态。

```javascript
import produce from "immer";

const nextState = produce(currentState, draft => {
  // 就像修改普通对象一样
  draft.count++;
  draft.user.age = 18;
});
```

---

## 二、 三大关键机制

### 1. Proxy (代理) - 拦截读写

Immer 利用 ES6 的 `Proxy` 对象来拦截你对 `draft` 的所有操作。

* **拦截读取 (Get)**:
  * 当你读取 `draft.a.b` 时，Immer 会检查这个节点是否已经被代理。如果没有，就创建一个新的 Proxy 包装它。这叫做 **Lazy Proxy (懒代理)**，只有被访问的节点才会被代理，保证了性能。
* **拦截写入 (Set)**:
  * 当你执行 `draft.x = 1` 时，Proxy 拦截到这个操作。
  * 它**不会**修改原始对象，而是标记该节点为 `modified`，并将新值保存在一个内部的 `copy` (副本) 对象上。

### 2. Structural Sharing (结构共享)

这是 Immer 高性能的秘诀。

* **修改过的节点**：Immer 会为其创建新的对象引用。
* **父级链路**：从修改节点一直到根节点，整条链路上的对象都会被创建新引用（因为子节点变了，父节点也就变了）。
* **未修改的节点**：直接复用原始对象的引用。

**结果**：新旧状态共享了大部分内存数据，既节省了内存，又让 React 的 `memo` 和 `PureComponent`（基于浅比较）依然有效。

### 3. Auto Freezing (自动冻结)

为了防止开发者在 `produce` 函数外部意外修改 State（这违反了 Immutable 原则），Immer 会在开发环境下**递归冻结**生成的新状态。

* **实现**：使用 `Object.freeze()`。
* **行为**：任何试图修改 `nextState` 的操作都会报错。
* **环境**：默认仅在开发环境开启，生产环境为了性能会自动关闭。

```javascript
const nextState = produce(state, draft => { ... });

// ❌ Error: Cannot assign to read only property
nextState.count = 100;
```

---

## 三、 手写迷你版 Immer (Mini-Immer)

为了更好地理解，我们可以实现一个简化版的核心逻辑：

```javascript
function produce(baseState, recipe) {
  // 存储原始对象到代理状态的映射
  const proxies = new Map();

  const handler = {
    get(target, prop) {
      const state = proxies.get(target);
      // 如果有副本，读副本；否则读原对象
      return state.copy ? state.copy[prop] : target[prop];
    },
    set(target, prop, value) {
      const state = proxies.get(target);
      if (!state.modified) {
        // 第一次修改：标记修改，创建浅拷贝副本
        state.modified = true;
        state.copy = { ...target };
      }
      state.copy[prop] = value; // 修改副本
      return true;
    }
  };

  function createProxy(target) {
    const draft = new Proxy(target, handler);
    proxies.set(target, { draft, copy: null, modified: false });
    return draft;
  }

  // 1. 创建根 Draft
  const rootDraft = createProxy(baseState);

  // 2. 执行配方
  recipe(rootDraft);

  // 3. 生成结果 (简化版：仅处理根节点)
  const rootState = proxies.get(baseState);
  return rootState.modified ? rootState.copy : baseState;
}
```

## 四、 总结

| 机制 | 作用 |
| :--- | :--- |
| **Proxy** | 拦截用户的读写操作，实现“像修改可变对象一样写代码”的体验。 |
| **Copy-on-Write** | 只有在真正写入时才创建副本，读取操作零开销。 |
| **Structural Sharing** | 复用未修改的节点，保证性能和 React 渲染优化的有效性。 |
| **Auto Freezing** | 保护生成的不可变状态不被意外篡改，增强代码健壮性。 |
