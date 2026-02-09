# React 性能优化完全指南

本文档总结了 React 开发中常见的性能优化手段，从架构设计到具体 API 的使用，涵盖了减少渲染次数、降低渲染成本和优化用户体验三个维度。

## 一、 减少不必要的渲染 (Reduce Re-renders)

这是 React 优化的核心，目标是阻断“父组件更新 -> 子组件无脑更新”的默认链条。

### 1. 组件记忆化 (Memoization)

使用 `React.memo` 包裹组件，仅当 props 发生浅比较变化时才重新渲染。

* **适用场景**：
  * 纯展示组件 (Presentational Components)。
  * Props 更新频率低，但父组件更新频繁。
  * 渲染开销大（包含复杂 DOM 结构或计算）的组件。

```tsx
const Child = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### 2. 稳定 Props 引用 (Stable References)

配合 `React.memo` 使用。如果传给子组件的回调函数或对象每次都是新的，`memo` 将失效。

* **useCallback**: 缓存函数引用。
* **useMemo**: 缓存对象/数组引用。

```tsx
// ✅ 正确示范
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []); // 依赖为空，函数地址永远不变

const config = useMemo(() => ({ color: 'red' }), []);

return <Child onClick={handleClick} config={config} />;
```

### 3. 状态管理策略 (State Strategy)

#### 3.1 状态下沉 (State Colocation)

将状态尽可能放置在需要它的组件层级中，而不是全部放在顶层。

*   **原理**：状态更新只会触发拥有该状态的组件及其子组件渲染。
*   **例子**：将模态框的 `isOpen` 状态移入 `Modal` 组件内部，避免开关模态框导致全页重渲染。

```tsx
// ❌ 优化前：input 变化导致 ExpensiveComponent 重渲染
function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <ExpensiveComponent />
    </div>
  );
}

// ✅ 优化后：状态下沉到 Form 组件，App 和 ExpensiveComponent 不受影响
function Form() {
  const [text, setText] = useState('');
  return <input value={text} onChange={e => setText(e.target.value)} />;
}

function App() {
  return (
    <div>
      <Form />
      <ExpensiveComponent />
    </div>
  );
}
```

#### 3.2 状态提升 (Lifting State Up)

当多个组件需要共享同一个状态时，将状态移动到它们最近的共同父组件中。

*   **适用场景**：两个兄弟组件需要通信，或者一个组件需要控制另一个组件。
*   **注意**：虽然这是 React 的基本模式，但过度提升会导致父组件渲染频繁，进而导致所有子组件（即使不需要该状态的）重渲染。
*   **优化配合**：通常需要配合 **状态下沉**（把没用到状态的部分拆出去）或者 **Context**（避免逐层透传 props）使用。

```tsx
// 父组件 (Parent)
function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0); // 状态提升到这里
  return (
    <>
      <Panel isActive={activeIndex === 0} onShow={() => setActiveIndex(0)} />
      <Panel isActive={activeIndex === 1} onShow={() => setActiveIndex(1)} />
    </>
  );
}
```

#### 3.3 使用 Ref 获取数据 (Uncontrolled Components)

如果父组件只需要在特定时刻（如提交时）获取子组件的数据，而不需要实时响应输入（如边打字边搜索），可以使用 `useRef` + `forwardRef`。

*   **原理**：`ref` 对象是稳定的（引用不变），且修改 `ref.current` 不会触发渲染。
*   **优势**：输入过程完全**零渲染**（Zero Re-renders）。

##### 基础用法：直接转发 DOM

```tsx
// 子组件：使用 forwardRef 暴露 DOM 或数据
const Form = React.forwardRef((props, ref) => {
  return <input ref={ref} />;
});

// 父组件
function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    // ✅ 随时读取，不需要 state，不需要重渲染
    console.log(inputRef.current?.value);
  };

  return (
    <div>
      <Form ref={inputRef} />
      <ExpensiveComponent /> {/* App 不渲染，它也不渲染 */}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

##### 进阶用法：暴露自定义 API (useImperativeHandle)

当子组件较复杂，或者不想暴露整个 DOM 节点时，可以使用 `useImperativeHandle` 自定义暴露给父组件的方法。这不仅是性能优化，也是良好的封装实践。

```tsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// 1. 定义暴露给父组件的接口
interface FormHandle {
  getValues: () => { username: string };
  reset: () => void;
}

const MyForm = forwardRef<FormHandle, {}>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. 自定义暴露的内容
  useImperativeHandle(ref, () => ({
    getValues: () => ({ username: inputRef.current?.value || '' }),
    reset: () => {
      if (inputRef.current) inputRef.current.value = '';
    }
  }));

  return <input ref={inputRef} />;
});

// 父组件使用
function App() {
  const formRef = useRef<FormHandle>(null);

  return (
    <MyForm ref={formRef} />
    <button onClick={() => console.log(formRef.current?.getValues())}>
      Get Data
    </button>
  );
}
```

### 4. 组件组合 (Composition) - 🌟 推荐

利用 `children` prop 来传递组件。

*   **原理**：当父组件（Wrapper）状态更新时，React 知道 `children` prop 是从上层传下来的，并没有改变，因此不会重新渲染 `children` 指向的组件。

```tsx
// ❌ 优化前：App 更新 -> ExpensiveComponent 更新
// 因为 ExpensiveComponent 是在 App 内部被调用的
function App() {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <ExpensiveComponent />
    </div>
  );
}

// ✅ 优化后：ColorPicker 更新 -> ExpensiveComponent 不更新
// ColorPicker 接收 children，它只知道 children 是一个 ReactElement，不需要知道具体是什么
function ColorPicker({ children }) {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      {children}
    </div>
  );
}

function App() {
  return (
    <ColorPicker>
      <ExpensiveComponent />
    </ColorPicker>
  );
}
```

### 5. Context 读写分离

当 Context Value 包含经常变的数据（State）和不变的方法（Dispatch）时，将它们拆分为两个 Context。

* **详见**：[Context + Reducer 读写分离优化](./react-context-reducer-optimization.md)

---

## 二、 减轻渲染负担 (Reduce Render Cost)

如果渲染不可避免，就让它执行得更快。

### 1. 列表虚拟化 (Virtualization)

对于长列表（成百上千条数据），只渲染视口可见区域的 DOM 节点。

* **库**：`react-window`, `react-virtualized`
* **收益**：极大的 DOM 节点数量减少，内存占用降低，滚动流畅。

### 2. 避免昂贵计算 (useMemo)

如果组件内部有复杂的同步计算（如大数组排序、过滤），使用 `useMemo` 缓存计算结果。

```tsx
// 只有当 list 变化时才重新排序
const sortedList = useMemo(() => {
  return heavySortFunction(list);
}, [list]);
```

### 3. 懒加载组件 (Lazy Loading)

不要在首屏加载所有代码。

* **API**: `React.lazy`, `Suspense`
* **场景**：路由页面、大型模态框、复杂图表。

```tsx
const LazyComponent = React.lazy(() => import('./HeavyChart'));

<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>
```

---

## 三、 优化响应体验 (Concurrent Features)

React 18 引入的并发特性，让应用在繁重计算下依然保持响应。

### 1. useTransition

将某些状态更新标记为“非紧急”（Transition）。React 会优先处理用户交互（如输入），并在空闲时处理 Transition 更新。

```tsx
const [isPending, startTransition] = useTransition();

// 输入框输入（高优先级）
setInputValue(e.target.value);

// 列表过滤（低优先级）
startTransition(() => {
  setSearchQuery(e.target.value);
});
```

### 2. useDeferredValue

获取某个值的“延迟版本”。类似于防抖（Debounce），但更智能，与 React 渲染周期集成。

```tsx
const deferredQuery = useDeferredValue(query);
// 使用 deferredQuery 进行耗时渲染，UI 会先显示旧值，随后更新
```

---

## 四、 最佳实践总结

1. **优先架构优化**：先尝试 **状态下沉** 和 **组件组合**，这通常能解决大部分不必要的渲染，且代码最干净。
2. **按需使用 Memo**：不要把所有组件都包上 `React.memo`。只有当组件渲染开销大且经常收到相同 Props 时才用。
3. **监测性能**：使用 React DevTools 的 Profiler 面板来定位真正的性能瓶颈，不要凭感觉优化。
