# 为什么 Vue 支持（并推荐）可变数据 (Mutable Data)？

在前端框架的哲学之争中，React 选择了 **Immutable (不可变)**，而 Vue 坚定地选择了 **Mutable (可变)**。这并非偶然，而是由 Vue 的**响应式原理**决定的。

## 一、 核心原理：依赖收集与劫持

Vue 之所以能支持可变数据，是因为它拥有一套精密的**侦测系统**。它不需要像 React 那样通过“比对新旧对象”来发现变化，而是直接**拦截**你的修改操作。

### 1. 拦截机制 (Interception)

*   **Vue 2**: 使用 `Object.defineProperty` 将对象的属性转化为 getter/setter。
*   **Vue 3**: 使用 ES6 `Proxy` 代理整个对象。

当你写下 `state.count++` 时，并不是简单的变量赋值，而是触发了 Vue 内部的 Setter/Proxy Trap。

### 2. 依赖收集 (Dependency Tracking)

Vue 知道“谁在使用这个数据”。

1.  当组件渲染时，会读取 `state.count`。
2.  Vue 的 Getter 拦截到这次读取，把当前组件（Effect）记录到 `count` 的“订阅者列表”中。
3.  这叫做**依赖收集**。

### 3. 派发更新 (Trigger)

1.  当你修改 `state.count = 2`。
2.  Vue 的 Setter 拦截到修改。
3.  Vue 查找 `count` 的订阅者列表，直接通知相关的组件：“你依赖的数据变了，快更新！”。
4.  组件收到通知，重新渲染。

**结论**：因为 Vue 精确地知道是哪个属性变了，以及哪个组件需要更新，所以它不需要 Immutable 数据来辅助 Diff 算法。直接修改数据是最符合这套机制的方式。

---

## 二、 对比 React (为什么 React 不行？)

为了更清楚地理解，我们需要对比 React 的机制。

### React 的机制：Pull-based (拉取式)

1.  React 组件就像一个函数：`View = f(State)`。
2.  当你调用 `setState` 时，React 只知道“有状态变了”，但不知道具体是哪一个。
3.  React 必须重新执行组件函数，生成新的 Virtual DOM 树。
4.  **关键点**：React 需要对比新旧两棵树（Reconciliation）。
    *   如果数据是 Mutable 的（直接修改 `obj.x = 1`），那么 `oldObj === newObj` 依然为 true（引用没变）。
    *   React 的浅比较（Shallow Compare）会认为数据没变，从而跳过更新，导致 Bug。
5.  **解决**：React 强制要求 Immutable（创建新对象 `{...obj, x: 1}`），这样 `oldObj !== newObj`，React 才能检测到变化。

### Vue 的机制：Push-based (推送式)

1.  Vue 不需要猜“哪里变了”。
2.  数据变化时，Vue 直接**推送**消息给订阅者。
3.  不需要 Diff 整棵数据树，也不需要比对对象引用。

---

## 三、 Mutable 的优势

### 1. 符合直觉 (Mental Model)
对于开发者来说，`user.name = 'Jack'` 显然比 `setUser({ ...user, name: 'Jack' })` 更符合人类的思维直觉。你不需要学习 Spread Operator (...)，也不需要处理深层嵌套的痛苦。

### 2. 性能 (Performance)
*   **内存**：Mutable 修改是原地修改，不需要频繁创建新的对象副本，减少了内存占用和垃圾回收（GC）的压力。
*   **粒度**：Vue 的更新粒度是“组件级”甚至“节点级”的，它通常不需要像 React 那样配合 `useMemo` 或 `React.memo` 来进行大量的性能优化，因为它天生就知道谁该更新，谁不该更新。

---

## 四、 总结

Vue 支持可变数据，是因为它建立在**响应式系统 (Reactivity System)** 之上。

*   **React**：我不知道谁变了，所以我需要你给我一个新的快照，我自己来比对。 -> **Immutable**
*   **Vue**：我监控了每一个属性，你改了我就知道，直接改就行。 -> **Mutable**
