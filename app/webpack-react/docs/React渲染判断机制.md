# React 组件重新渲染的判断机制 (Re-render Conditions)

React 决定一个组件是否需要“重新渲染”（即重新执行组件函数或 `render` 方法），遵循一套严格的判断逻辑。

理解这套逻辑是进行 React 性能优化的基础。

## 1. 核心触发源 (Triggers)

只要满足以下任意一个条件，React 就会尝试重新渲染组件：

### A. State 发生变化
*   **机制**：调用 `setState` (Class) 或 `useState/useReducer` (Hooks)。
*   **判断标准**：`Object.is(oldState, newState)`。
    *   如果引用不同（`old !== new`），触发渲染。
    *   如果引用相同（`old === new`），React 自动**跳过**（Bailout）。

### B. 父组件重新渲染 (Parent Re-render)
*   **机制**：父组件渲染时，默认会递归渲染所有子组件。
*   **判断标准**：**默认无条件渲染**。
    *   除非子组件使用了优化策略（`React.memo` 或 `PureComponent`），否则不管 Props 变没变，子组件都会跟着渲染。

### C. Context 发生变化
*   **机制**：组件通过 `useContext` 或 `<Consumer>` 订阅了某个 Context。
*   **判断标准**：Provider 的 `value` 发生变化（引用不同）。
*   **强制性**：Context 的变化会**穿透** `React.memo` 和 `shouldComponentUpdate`。即使中间的父组件跳过了渲染，订阅了 Context 的子组件依然会被强制唤醒。

---

## 2. 拦截与跳过机制 (Bailout Strategies)

React 提供了几种方式来“拦截”上述的默认渲染行为。

### A. `React.memo` (函数组件)
*   **作用**：将组件变为“纯组件”，仅在 Props 变化时渲染。
*   **默认行为**：对 Props 进行**浅比较** (Shallow Compare)。
    *   如果 `prevProps.a === nextProps.a` 且 `prevProps.b === nextProps.b` ... -> **跳过渲染**。
*   **自定义行为**：可以传入第二个参数 `arePropsEqual(prev, next)` 来手写比较逻辑。

### B. `PureComponent` / `shouldComponentUpdate` (类组件)
*   **PureComponent**：自动对 Props 和 State 进行浅比较。
*   **shouldComponentUpdate**：生命周期函数，返回 `false` 则跳过渲染。

---

## 3. 决策流程图 (Decision Flow)

当一个组件（Component）准备被 React 更新时，决策路径如下：

1.  **Context 检查**：
    *   🔍 该组件订阅的 Context Value 变了吗？
    *   🚨 变了 -> **强制渲染 (Force Render)** (无视 memo)。
    *   ✅ 没变 -> 继续下一步。

2.  **State 检查**：
    *   🔍 该组件自身的 State 变了吗？
    *   🚨 变了 -> **渲染**。
    *   ✅ 没变 -> 继续下一步。

3.  **Props & 父组件检查**：
    *   🔍 父组件渲染了吗？
        *   ❌ 没渲染 -> 组件保持静止。
        *   ✅ 渲染了 -> 检查是否有优化策略？
            *   **无优化 (默认)** -> **渲染** (即使 Props 没变)。
            *   **有优化 (memo)** -> 对比 `prevProps` vs `nextProps`。
                *   🚨 不相等 -> **渲染**。
                *   ✅ 相等 -> **跳过 (Bailout)**。

---

## 4. 常见误区 (Common Pitfalls)

### Q1: 父组件更新，子组件没收到新的 Props，子组件会更新吗？
*   **会！** 默认情况下，父组件更新会导致所有子组件更新。
*   **解决**：使用 `React.memo` 包裹子组件。

### Q2: 我用了 `React.memo`，为什么还是每次都渲染？
*   **原因**：通常是因为 Props 里的**引用类型**（对象、数组、函数）每次都是新的。
    ```jsx
    // ❌ 错误：每次父组件渲染，handleClick 都是一个新函数 (新地址)
    <Child onClick={() => console.log('click')} />
    
    // ✅ 正确：使用 useCallback 缓存函数引用
    const handleClick = useCallback(() => console.log('click'), []);
    <Child onClick={handleClick} />
    ```

### Q3: Context 变了，中间使用了 `memo` 的组件会重绘吗？
*   **不会重绘**（如果是中间层且没用 Context）。
*   但是，**订阅了 Context 的底层子组件**会重绘。Context 穿透了中间的 `memo` 组件。
