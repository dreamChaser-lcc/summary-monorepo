# React 开发避坑指南与常见问题解析

本文总结 React 开发中常见的陷阱、性能问题及最佳实践，帮助开发者编写更健壮的代码。

## 一、组件卸载后的状态更新 (内存泄漏警告)

### 1. 现象
报错：`Warning: Can't perform a React state update on an unmounted component.`
原因：组件已卸载，但异步操作（API 请求、定时器）的回调仍在执行并尝试 `setState`。

> **注意：React 18 的变更**
> 在 React 18 中，这个警告已经被**移除**了（变为静默失败）。React 团队认为这通常不是内存泄漏（因为 JS 引擎会回收闭包），而且为了消除这个警告需要写大量的样板代码（isMounted），弊大于利。但在 React 16/17 中，这依然是一个需要关注的问题。

### 2. 解决方案

#### 方案 A：使用 AbortController (推荐，最标准)
不仅防止报错，还能真正取消网络请求。
```javascript
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setData(data))
    .catch(err => {
      if (err.name === 'AbortError') return; // 忽略取消错误
      console.error(err);
    });

  return () => controller.abort(); // 卸载时取消
}, []);
```

#### 方案 B：使用 isMounted 标志位
```javascript
useEffect(() => {
  let isMounted = true;
  
  someAsyncOp().then(data => {
    if (isMounted) setData(data); // 只有挂载状态才更新
  });

  return () => { isMounted = false };
}, []);
```

---

## 二、useEffect 依赖项陷阱 (Infinite Loop)

### 1. 现象
组件无限循环渲染，或者 `useEffect` 执行频率不符合预期。

### 2. 常见场景与解法

*   **场景一：依赖了引用类型（对象/数组）**
    ```javascript
    // ❌ 错误：每次渲染 options 都是新对象，导致 Effect 无限执行
    const options = { id: 1 };
    useEffect(() => { fetchData(options) }, [options]);

    // ✅ 正确：将对象移到 Effect 内部，或使用 useMemo
    useEffect(() => { fetchData({ id: 1 }) }, []); 
    // 或
    const options = useMemo(() => ({ id: 1 }), []);
    ```

*   **场景二：依赖了函数**
    ```javascript
    // ❌ 错误：每次渲染 fetchData 都是新函数
    function fetchData() { ... }
    useEffect(() => { fetchData() }, [fetchData]);

    // ✅ 正确：使用 useCallback 包裹函数
    const fetchData = useCallback(() => { ... }, []);
    ```

*   **场景三：遗漏依赖项**
    不要欺骗 React（为了少执行而不填依赖），这会导致闭包陷阱（Closure Trap），读取到旧的 State。建议启用 eslint 插件 `react-hooks/exhaustive-deps`。

---

## 三、闭包陷阱 (Stale Closure)

### 1. 现象
在 `useEffect` 或 `useCallback` 中读取到的 State 永远是旧值（初始值），即使 State 已经更新了。

### 2. 示例
```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 永远打印 0！因为闭包锁住了初始渲染时的 count
      // setCount(count + 1); // ❌ 错误：count 也是旧的
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 依赖为空，Effect 只执行一次
}
```

### 3. 解决方案
使用 **函数式更新 (Functional Update)**：
```javascript
setCount(prevCount => prevCount + 1); // ✅ 正确：通过回调拿到最新的 state
```
或者将 `count` 加入依赖数组（但这会导致定时器被频繁重置）。

---

## 四、State 更新的异步性

### 1. 现象
调用 `setState` 后立即打印 state，发现还是旧值。
```javascript
const handleClick = () => {
  setCount(1);
  console.log(count); // 打印 0，不是 1
};
```

### 2. 原因
React 的 State 更新是**异步**（批处理）的。出于性能考虑，React 会把多个 `setState` 合并成一次更新。

### 3. 解决方案
使用 `useEffect` 监听变化，或者在 Class 组件中使用 `setState` 的回调函数。
```javascript
useEffect(() => {
  console.log(count); // 这里能拿到最新的 1
}, [count]);
```

---

## 五、列表渲染 Key 的误用

### 1. 现象
列表顺序变化、删除项时，输入框内容错乱，或者性能低下。

### 2. 错误写法
使用 `index` 作为 Key。
```javascript
{list.map((item, index) => <li key={index}>{item}</li>)}
```

### 3. 原因
当列表发生**增删、排序**时，使用 `index` 会导致 React 复用错误的 DOM 节点，因为 React 认为 key 没变就是同一个组件。

### 4. 正确写法
使用数据中**唯一且稳定**的 ID。
```javascript
{list.map((item) => <li key={item.id}>{item}</li>)}
```

---

## 六、Context 滥用导致的性能问题

### 1. 现象
Context Provider 更新时，所有消费该 Context 的子组件都会强制重渲染，即使它们只用到了 Context 中的一部分数据。

### 2. 解决方案
*   **拆分 Context**：将变动频繁的数据（如 `ThemeColor`）和不常变的数据（如 `UserConfig`）分开放到不同的 Context 中。
*   **配合 `useMemo`**：确保 Provider 的 `value` 引用稳定。
    ```javascript
    // ❌ 错误：每次渲染 value 都是新对象
    <Context.Provider value={{ theme, setTheme }}>

    // ✅ 正确
    const value = useMemo(() => ({ theme, setTheme }), [theme]);
    <Context.Provider value={value}>
    ```
*   **使用状态管理库**：对于复杂的高频更新，Redux / MobX / Zustand 等库通过订阅机制避免了 Context 的全量更新问题。

---

## 七、React 严格模式 (Strict Mode) 深度解析

### 1. 什么是严格模式？
`<React.StrictMode>` 是一个开发工具，用于突出显示应用程序中的潜在问题。它**仅在开发模式 (Development) 下运行**，不会影响生产构建。

### 2. 严格模式的主要行为

#### A. 双重调用 (Double Invocation)
*   **现象**：`console.log` 会打印两次。
*   **范围**：组件的渲染函数（Function Body）、`useState` / `useMemo` / `useReducer` 的初始化函数。
*   **目的**：检测**不纯的副作用 (Impure Side Effects)**。如果你的渲染函数修改了外部变量，两次调用的结果就会不一致，从而暴露 Bug。

**示例：不纯的渲染函数**
```javascript
let guest = 0; // 外部变量

function Cup() {
  // ❌ 错误：在渲染过程中修改外部变量（副作用）
  guest = guest + 1;
  return <h2>Tea cup for guest #{guest}</h2>;
}
```
*   **预期**：guest #1, guest #2, guest #3。
*   **严格模式下**：React 会故意调用两次渲染函数。第一次渲染，guest 变成 2；第二次渲染，guest 变成 4。这种不一致性直接暴露了组件不仅依赖 props，还依赖（并修改了）外部变量的问题。

#### B. 检测过时的 API
*   **警告使用 `findDOMNode`**：这是一个反模式 API，破坏了组件封装性。推荐使用 `ref`。
*   **警告使用过时的 Context API**：老版本的 `childContextTypes` 等。
*   **警告使用字符串 ref**：
    ```javascript
    // ❌ 错误：字符串 ref
    <input ref="myInput" />
    
    // ✅ 正确：回调 ref 或 createRef
    <input ref={el => this.input = el} />
    ```

### 3. 严格模式下的 useEffect (React 18+)
这是 React 18 引入的最具争议但也最重要的变更：**Effect 的双重执行**。

*   **执行顺序**：
    1.  React 挂载组件。
    2.  **Effect 执行** (Mount)。
    3.  React 模拟组件卸载 (Unmount)。
    4.  **Cleanup 执行**。
    5.  React 再次挂载组件。
    6.  **Effect 再次执行** (Remount)。
    
    简而言之：**Mount -> Unmount -> Mount**。

*   **目的**：
    为了确保你的 Effect 逻辑能够**正确处理组件的卸载和重新挂载**。这是为了未来 React 的**并发特性 (Concurrent Features)** 做准备，比如用户切走 Tab 再切回来，或者使用 `<Offscreen>` API 时，组件状态应该被保留并能正确恢复。

*   **常见问题**：
    如果你的 Effect 逻辑**不是幂等的**（比如发送埋点请求、创建 WebSocket 连接），就会导致请求发了两次、连接建了两次。

*   **解决方案**：
    **必须编写 Cleanup 函数**！
    ```javascript
    useEffect(() => {
      const connection = createConnection();
      connection.connect();
      
      // ✅ 必须返回 Cleanup 函数，否则连接会创建两次
      return () => {
        connection.disconnect();
      };
    }, []);
    ```
    对于一次性的埋点请求，可以使用 `useRef` 标记是否已发送，或者接受开发环境下的双重发送（生产环境不会发生）。

### 4. 严格模式的好处与注意事项

*   **好处 (Benefits)**：
    1.  **提前发现 Bug**：通过双重调用，强制你的组件是纯函数（Pure Function）。如果组件依赖了外部可变状态（如全局变量），两次渲染结果不一致，Bug 就会暴露。
    2.  **为并发模式做准备**：未来的 React 并发特性（如 `Offscreen API`）可能在后台渲染组件，或者暂停/恢复渲染。如果你的 Effect 不能正确处理多次 Mount/Unmount，在并发模式下就会出问题。
    3.  **检测内存泄漏**：双重 Effect 执行能帮你发现那些忘记清理的定时器或订阅。

*   **缺陷与“坑” (Caveats)**：
    1.  **Console Log 干扰**：所有的 `console.log` 都会打印两次，调试时可能会觉得很烦（React DevTools 有个选项可以变灰其中一次）。
    2.  **性能开销**：双重渲染虽然只发生在开发环境，但在大型应用中可能会感觉比生产环境慢。
    3.  **第三方库兼容性**：一些老旧的第三方库（特别是那些手动操作 DOM 或全局状态的库）在严格模式下可能会报错或表现异常。

*   **注意点**：
    *   严格模式**仅在开发环境**生效，生产构建会自动去除。
    *   如果你发现某个 Bug 只在开发环境出现，生产环境正常，很有可能是严格模式暴露了你的代码不纯（Impure）。
    *   不要为了消除双重调用的“烦恼”而关闭严格模式，这是掩耳盗铃。

---

## 七、React 18 核心变更与新特性 (面试必考)

### 1. 自动批处理 (Automatic Batching)
*   **React 17及之前**：只有在 React 事件处理器（如 `onClick`）中的 `setState` 才会批处理。在 `setTimeout`, `fetch` 回调中的更新是**同步**的（多次 render）。
*   **React 18**：所有环境下的更新（包括 Promise, setTimeout, Native Event）都会自动合并为一次 render。
*   **例外**：如果需要强制同步更新，使用 `flushSync`。

### 2. 并发模式 (Concurrent Features)
*   **核心**：渲染可以中断。React 可以暂停当前的渲染任务，去处理更高优先级的任务（如用户输入），然后再回来继续渲染。
*   **API**：
    *   `useTransition`: 将状态更新标记为“非紧急”（Transition），允许被中断。
    *   `useDeferredValue`: 延迟更新某个值（类似防抖，但更智能）。

### 3. `useId` (服务端渲染友好)
生成在服务端和客户端都稳定的唯一 ID，解决了 SSR 水合不匹配的问题。

### 4. `useSyncExternalStore` (库作者专用)
用于订阅外部数据源（如 Redux store），解决并发渲染下的数据撕裂（Tearing）问题。替代了 `useEffect` + `useState` 的手动订阅模式。

---

## 八、React 常见面试考点补充

### 1. Fiber 架构原理
*   **背景**：React 15 的递归 Diff 是同步且不可中断的，导致主线程阻塞，动画卡顿。
*   **Fiber**：一种数据结构（链表），也是一种工作单元。它将渲染任务拆分为小片，利用浏览器的空闲时间（requestIdleCallback）执行。
*   **双缓存树 (Double Buffering)**：`current` 树（屏幕显示的）和 `workInProgress` 树（正在构建的）。构建完成后一次性替换。

### 2. 合成事件 (SyntheticEvent)
*   **机制**：React 不直接将事件绑定到 DOM 节点，而是代理到 `root` (React 17+) 或 `document` (React 16) 上。
*   **目的**：跨浏览器兼容、性能优化（对象池复用）。
*   **注意**：在 React 17 之前，`e.stopPropagation()` 无法阻止原生事件冒泡；React 17 之后修复了这个问题。

### 3. HOC (高阶组件) vs Hooks
*   **HOC**：参数是组件，返回值是新组件。
    *   **缺点**：Props 命名冲突、嵌套地狱（Wrapper Hell）、Ref 传递麻烦（需 React.forwardRef）。
*   **Hooks**：
    *   **优点**：逻辑复用更纯粹（不增加组件层级）、代码更扁平、无 `this` 困扰。

### 4. `key` 的作用与原理
*   **作用**：在 Diff 算法中标识节点的唯一性。
*   **原理**：React 对比新旧虚拟 DOM 时，如果 `key` 相同，会复用该 Fiber 节点（只更新属性）；如果 `key` 不同，则销毁旧节点，创建新节点。
*   **禁忌**：不要用随机数（每次都销毁重建，失去 Diff 意义，Input 失去焦点）。

### 5. `React.memo` vs `useMemo`
*   **React.memo**：用于**组件**。对比 Props 是否变化，决定是否重渲染组件（类似 PureComponent）。
*   **useMemo**：用于**值**。缓存计算结果，避免每次渲染都重新计算高开销逻辑。
