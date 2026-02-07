# React 渲染流程详解 (The Render Pipeline)

React 渲染页面的流程在 React 16 (Fiber 架构) 之后被设计为两个主要阶段：**Render 阶段（渲染/调和）** 和 **Commit 阶段（提交）**。

其核心思想是：**“先在内存里算好怎么改（Render），再一次性把修改应用到页面上（Commit）”**。

## 1. 第一阶段：Render Phase (渲染/调和)

**关键词**：内存计算、Diff 算法、可中断

这个阶段是纯 JavaScript 计算，完全在内存中进行，**不会**修改真实的 DOM，所以用户看不到任何变化。

### 1.1 触发更新

* 通过 `ReactDOM.createRoot().render` (首屏) 或 `setState` / `hooks` (更新) 触发。
* React 会从根节点开始遍历 Fiber 树。

### 1.2 调用组件函数 (BeginWork)

* React 执行你的函数组件（`function App() { ... }`）。
* 生成新的 **Virtual DOM** (React Element)。

### 1.3 对比找茬 (Reconciliation / Diff)

* React 拿着**新生成的 Virtual DOM** 和 **旧的 Fiber 树** 进行对比。
* **Diff 算法**在这里发挥作用：
  * 类型变了（`div` -> `span`）？ -> 标记为“删除旧的，插入新的”。
  * 属性变了（`id="a"` -> `id="b"`）？ -> 标记为“更新属性”。
  * 没变？ -> 复用旧节点。

### 1.4 打标签 (Effect Tag / Flags)

* React 会在 Fiber 节点上打上标记（Flags），比如 `Placement` (插入), `Update` (更新), `Deletion` (删除)。
* 最终生成一条**副作用链 (Effect List)**，上面记录了所有需要修改的地方。

> **注意**：这个阶段是**可中断**的。如果浏览器忙（比如用户在打字），React 可以暂停计算，先把主线程还给浏览器，等空闲了再回来继续算。

---

## 2. 第二阶段：Commit Phase (提交)

**关键词**：操作 DOM、执行副作用、不可中断

一旦 Render 阶段算完了，确认了所有要改的地方，就会进入 Commit 阶段。这个阶段必须**一气呵成**，不能暂停，否则用户会看到页面闪烁（比如只更新了一半）。

### 2.1 Before Mutation (DOM 变更前)

* 执行 `getSnapshotBeforeUpdate`。
* (React 18) 可能会处理一些 `useEffect` 的清理函数。

### 2.2 Mutation (DOM 变更)

* **真正的 UI 更新发生在这里！**
* React 遍历 Render 阶段生成的副作用链。
* 根据标记（Flags）执行真正的 DOM 操作：`appendChild` (插入), `removeChild` (删除), `setAttribute` (更新属性)。
* 此时，浏览器页面上的内容真正改变了。

### 2.3 Layout (布局/副作用)

* DOM 改完了。
* React 切换 `current` 指针（把新生成的 Fiber 树变成当前树）。
* **执行生命周期/Hooks**:
  * 同步执行 `useLayoutEffect` 回调。
  * (稍后异步执行) `useEffect` 回调。

---

## 3. 流程总结图

```text
[触发更新] (setState)
     |
     v
------------------ Render 阶段 (可中断/JS计算) ------------------
1. 遍历 Fiber 树
2. 执行组件函数 (生成 VDOM)
3. Diff 对比 (新 VDOM vs 旧 Fiber)
4. 标记副作用 (Flags: 增/删/改)
     |
     v
------------------ Commit 阶段 (不可中断/DOM操作) ------------------
1. 操作真实 DOM (Mutation) -> 用户看到界面变化
2. 执行 useLayoutEffect (同步)
3. 执行 useEffect (异步，稍后执行)
```

## 4. 为什么要分两步？

为了**性能**和**体验**。

* **避免阻塞**: 如果直接边算边改 DOM，一旦计算量大，页面就会卡死。分两步后，计算阶段（Render）可以被拆分、暂停，保证浏览器响应用户交互。
* **原子性提交**: Commit 阶段是瞬间完成的，保证了 UI 更新的连贯性，用户不会看到“渲染了一半”的界面。
