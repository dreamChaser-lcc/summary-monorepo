# React 渲染机制深度解析：从 JSX 到 DOM 的全过程

要彻底理解 React 的渲染机制，我们需要把目光聚焦在三个核心阶段：**Render (计算)**、**Reconciliation (协调)** 和 **Commit (提交)**。

与 Vue 依赖“响应式+模板编译”不同，React 依赖“运行时调度+Fiber架构”。

## 一、 宏观流程图

```mermaid
graph LR
A[触发更新 setState] -->|调度器 Scheduler| B[Render Phase (构建 Fiber)]
B -->|协调 Reconciliation| C[Effect List (副作用链表)]
C -->|提交 Commit Phase| D[真实 DOM]
Data[State/Props] -->|全量 Diff| B
```

---

## 二、 阶段一：Render (渲染/计算) - 构建 Fiber 树

React 没有 Vue 那样的“模板编译优化”，它的 JSX 本质上就是 JS。React 的核心任务是构建和比对 **Fiber 树**。

### 1. 触发 (Trigger)

当调用 `setState` 或 `hooks` 触发更新时，React 不会立刻更新，而是由 **Scheduler (调度器)** 根据优先级决定何时开始。

* **高优先级**：用户输入、点击（立刻处理）。
* **低优先级**：数据加载、后台日志（稍后处理）。

### 2. 构建 Fiber 树 (Work Loop)

React 开始遍历组件树，为每个组件创建一个 **Fiber Node**（虚拟 DOM 的升级版）。

* **Fiber**：是一个链表结构的对象，它记录了组件的状态、Props 和 DOM 节点信息。
* **双缓存机制 (Double Buffering)**：
  * **Current Tree**：屏幕上正在显示的树。
  * **WorkInProgress Tree**：正在后台构建的新树。
  * **Diff**：React 在构建 WIP 树时，会将其与 Current 树进行比对。

### 3. 可中断渲染 (Time Slicing) - React 的性能秘密

这是 React 16+ 最核心的特性。

* **机制**：React 把渲染任务拆分成一个个小的 Fiber 单元。每处理完一个单元，就看看浏览器有没有更紧急的任务（如用户打字）。
* **作用**：如果有紧急任务，React 会**暂停**当前的渲染，把主线程还给浏览器，等空闲了再回来继续。这保证了即使组件树很大，页面也不会卡顿。

---

## 三、 阶段二：Reconciliation (协调) - 找出差异

在构建 Fiber 树的过程中，React 会同时进行 Diff 算法。

### 1. 深度优先遍历

React 从根节点开始，深度优先遍历整个 Fiber 树。

### 2. Diff 策略

React 的 Diff 比较简单粗暴（相比 Vue 的靶向更新）：

* **同级比较**：只比较同一层级的节点。
* **Key 属性**：利用 Key 来识别节点是否移动了位置。
* **类型检查**：如果节点类型变了（`div` -> `span`），直接销毁重建整棵子树。

### 3. 生成 Effect List

Diff 完后，React 不会立刻改 DOM，而是给变化的 Fiber 节点打上标记（Tag）：

* `Placement` (新增)
* `Update` (修改)
* `Deletion` (删除)

所有有标记的节点会被串成一个链表（Effect List），这就是“需要更新的清单”。

---

## 四、 阶段三：Commit (提交) - 更新 DOM

这一阶段是**同步执行**的，不可中断（为了防止页面闪烁）。

1. **Before Mutation**：
    * 执行 `getSnapshotBeforeUpdate`。
    * 处理 `useEffect` 的清理函数。
2. **Mutation (DOM 操作)**：
    * React 遍历 Effect List。
    * 根据 Tag 执行真实的 DOM 操作（增删改）。
    * 此时页面 DOM 已经变了。
3. **Layout (布局后)**：
    * 执行 `useLayoutEffect`。
    * 执行 `componentDidMount` / `componentDidUpdate`。
    * 最后调度 `useEffect`（它会在浏览器绘制后异步执行）。

---

## 五、 总结：React 与 Vue 的核心差异

| 维度 | Vue (精确打击) | React (地毯式轰炸 + 时间管理) |
| :--- | :--- | :--- |
| **触发机制** | **Push (推送)**：数据变了，直接通知对应的组件。 | **Pull (拉取)**：状态变了，React 从根节点（或边界）开始重新跑一遍。 |
| **Diff 粒度** | **中细粒度**：组件级更新，内部配合编译时优化（静态提升）。 | **粗粒度**：递归比对整棵树，依靠 `memo` 手动优化。 |
| **核心优势** | **编译时优化**：编译器能识别静态节点，Diff 极快。 | **运行时调度 (Fiber)**：利用时间切片，保证在重负载下 UI 依然流畅。 |
| **心智模型** | **自动化**：你只管改数据，剩下的交给我。 | **控制力**：你需要了解渲染原理，手动控制性能（useMemo）。 |

* **Vue** 赢在“我这棵树里有 90% 是静态的，我一眼就能看出哪儿变了”。
* **React** 赢在“这棵树太大了，我算不过来，但我可以算一会儿歇一会儿，不让用户觉得卡”。
