# React 19 新特性详解：简化与进化

React 19 带来了近年来最大的 API 变更，核心目标是**简化开发体验**和**原生支持异步操作**。本文将详细对比新旧写法，并介绍其他重要的新特性。

## 1. 代码简化：新旧写法对比 (The "Simplification")

React 19 致力于移除那些“为了让 React 开心而写的样板代码”，让代码回归 JavaScript 本身。

### 1.1 表单提交 (Actions)

不再需要手动管理 `isPending` 和 `error` 状态，不再需要 `onSubmit` 和 `e.preventDefault()`。

*   **React 18 (旧)**:
    ```jsx
    function UpdateName() {
      const [name, setName] = useState("");
      const [error, setError] = useState(null);
      const [isPending, setIsPending] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsPending(true);
        try {
          await updateName(name);
        } catch (error) {
          setError(error);
        } finally {
          setIsPending(false);
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={isPending}>Update</button>
          {error && <p>{error}</p>}
        </form>
      );
    }
    ```

*   **React 19 (新)**: 使用 `useActionState`
    ```jsx
    // Action 函数现在可以返回新的状态
    async function updateNameAction(previousState, formData) {
      try {
        await updateName(formData.get("name"));
        return { success: true };
      } catch (e) {
        return { error: e.message };
      }
    }

    function UpdateName() {
      // 自动管理状态、Loading 和 Form Action
      const [state, formAction, isPending] = useActionState(updateNameAction, null);

      return (
        <form action={formAction}>
          <input name="name" />
          <button disabled={isPending}>Update</button>
          {state?.error && <p>{state.error}</p>}
        </form>
      );
    }
    ```

### 1.2 抛弃 `forwardRef`

`ref` 现在只是一个普通的 prop，就像 `className` 一样。

*   **React 18 (旧)**:
    ```jsx
    const MyInput = forwardRef((props, ref) => {
      return <input {...props} ref={ref} />;
    });
    ```

*   **React 19 (新)**:
    ```jsx
    function MyInput({ ref, ...props }) {
      return <input {...props} ref={ref} />;
    }
    ```

### 1.3 `use` API：在条件语句中读取 Context

打破了 Hook 不能在条件语句中调用的限制（仅限 `use` API）。

*   **React 18 (旧)**:
    ```jsx
    function ThemeText({ show }) {
      const theme = useContext(ThemeContext); // 必须在顶层，即使 show 为 false 也会执行
      if (!show) return null;
      return <div style={{ color: theme.color }}>...</div>;
    }
    ```

*   **React 19 (新)**:
    ```jsx
    import { use } from 'react';

    function ThemeText({ show }) {
      if (!show) return null;
      // 只有在需要时才读取 Context
      const theme = use(ThemeContext);
      return <div style={{ color: theme.color }}>...</div>;
    }
    ```

---

## 2. 其他重磅新特性 (The "Power")

### 2.1 `useOptimistic`: 乐观更新 UI

在数据发送到服务器之前，立即更新 UI，给用户“极速”的感觉。如果请求失败，React 会自动回滚状态。

```jsx
function ChatApp({ messages }) {
  // optimisticMessages 是用于展示的（包含预判成功的消息）
  // addOptimisticMessage 是用来临时添加消息的函数
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, newMessage]
  );

  const formAction = async (formData) => {
    const message = formData.get("message");
    // 1. 立即更新 UI (不等待网络)
    addOptimisticMessage(message);
    // 2. 发送真实请求
    await sendMessage(message);
  };

  return (
    <div>
      {optimisticMessages.map((m) => <div>{m}</div>)}
      <form action={formAction}>...</form>
    </div>
  );
}
```

### 2.2 Document Metadata: 原生支持 `<title>` 和 `<meta>`

不再需要 `react-helmet` 或 Next.js 的 `<Head>`，React 原生支持在任何组件中修改文档元数据，并自动提升到 `<head>`。

```jsx
function BlogPost({ title }) {
  return (
    <article>
      {/* 直接写在组件里，React 会自动把它移到 <head> 中 */}
      <title>{title} - My Blog</title>
      <meta name="description" content="This is a post..." />
      
      <h1>{title}</h1>
    </article>
  );
}
```

### 2.3 资源预加载 (Asset Loading)

React 19 提供了新的 API 来声明式地预加载资源，React 会智能地去重和安排加载时机。

```jsx
import { preinit, preload } from 'react-dom';

function MyComponent() {
  // 告诉浏览器：这个组件渲染时，顺便把这个脚本和样式加载了
  preinit('https://example.com/script.js', { as: 'script' });
  preload('https://example.com/font.woff2', { as: 'font' });
  
  return ...;
}
```

### 2.4 Server Components (RSC) 的完善

虽然 RSC 在 Next.js 中已经存在了一段时间，但 React 19 标志着 RSC 规范的稳定。它允许组件**仅在服务端运行**，不向客户端发送任何 JS 代码，极大地减小了包体积。

### 2.5 `<Context>` 直接作为 Provider

不再需要 `<Context.Provider value={...}>`，直接写 `<Context value={...}>` 即可。

*   **React 18**: `<ThemeContext.Provider value="dark">...</ThemeContext.Provider>`
*   **React 19**: `<ThemeContext value="dark">...</ThemeContext>`

---

## 3. 总结

React 19 是一个**“做减法”**的版本。它通过引入 Actions (`useActionState`) 和 `use` API，移除了大量为了处理异步状态和副作用而产生的样板代码。同时，配合 React Compiler，它正在让 React 的开发体验回归到最纯粹的 JavaScript 逻辑。
