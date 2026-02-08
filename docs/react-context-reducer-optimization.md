# React 性能优化：useReducer + Context 读写分离

在大型 React 应用中，跨组件状态共享通常使用 Context API。但如果不加控制，Context 往往会成为性能瓶颈——**任何 Context 值的变化都会导致所有消费该 Context 的组件强制重渲染**。

结合 `useReducer` 和 **双 Context 模式（读写分离）** 是解决这一问题的最佳实践。

## 1. 核心问题：为什么普通的 Context 会慢？

### ❌ 传统的合并模式

```tsx
// 你的 Context 既包含数据(state)，也包含方法(dispatch)
const GlobalContext = createContext({ tasks: [], dispatch: () => {} });

function App() {
  const [tasks, dispatch] = useReducer(reducer, []);
  
  // 💀 性能陷阱：
  // 每次 tasks 变化，value 对象都会变成一个新的引用！
  // { tasks: [...new], dispatch } !== { tasks: [...old], dispatch }
  return (
    <GlobalContext.Provider value={{ tasks, dispatch }}>
      <AddTask />  {/* 只想发命令，不关心数据 */}
      <TaskList /> {/* 需要渲染数据 */}
    </GlobalContext.Provider>
  );
}
```

**后果**：
当 `tasks` 更新时，`value` 变了，导致 `GlobalContext` 变了。
即使 `<AddTask />` 只需要 `dispatch`（而 `dispatch` 其实根本没变），但因为它消费了 `GlobalContext`，它会被**强制重渲染**。

---

## 2. 解决方案：双 Context 读写分离

我们要利用 `useReducer` 返回的 `dispatch` 函数**永远稳定（引用不变）** 这一特性。

### ✅ 优化模式

我们将 Context 拆分为两个：
1.  **StateContext**：只存数据（经常变）。
2.  **DispatchContext**：只存方法（永远不变）。

```tsx
export const TasksContext = createContext(null);
export const TasksDispatchContext = createContext(null);

function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

  return (
    <TasksContext.Provider value={tasks}>            {/* 变化流 */}
      <TasksDispatchContext.Provider value={dispatch}> {/* 稳定流 */}
        <AddTask />
        <TaskList />
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}
```

---

## 3. 完整代码实现

### 3.1 定义 Context 和 Reducer

```tsx
// TasksContext.tsx
import { createContext, Dispatch } from 'react';

// 定义类型
export interface Task { id: number; text: string; done: boolean; }
export type Action = { type: 'added'; id: number; text: string } | { type: 'deleted'; id: number };

// 1. 数据 Context
export const TasksContext = createContext<Task[] | null>(null);

// 2. 方法 Context (Dispatch 永远稳定)
export const TasksDispatchContext = createContext<Dispatch<Action> | null>(null);
```

### 3.2 只需要 Dispatch 的组件 (AddTask)

这个组件是优化的核心受益者。

```tsx
// AddTask.tsx
import { useContext, useState, memo } from 'react';
import { TasksDispatchContext } from './TasksContext';

// 💡 关键点 1: 使用 memo 包裹
// 如果父组件重渲染，只要 Props 没变，且 Context 没变，它就不会渲染。
const AddTask = memo(() => {
  console.log('Render: AddTask'); // 优化成功时，添加任务这里不会打印

  const [text, setText] = useState('');
  // 💡 关键点 2: 只消费 DispatchContext
  const dispatch = useContext(TasksDispatchContext);

  return (
    <button onClick={() => {
      setText('');
      dispatch({ type: 'added', id: Date.now(), text });
    }}>
      Add
    </button>
  );
});
```

### 3.3 需要数据的组件 (TaskList)

这个组件必须重渲染，因为它依赖数据。

```tsx
// TaskList.tsx
import { useContext } from 'react';
import { TasksContext } from './TasksContext';

const TaskList = () => {
  console.log('Render: TaskList'); // 数据变了，这里必须打印
  // 只消费数据 Context
  const tasks = useContext(TasksContext);

  return (
    <ul>
      {tasks!.map(task => <li key={task.id}>{task.text}</li>)}
    </ul>
  );
};
```

---

## 4. 优化效果验证

当我们在 `AddTask` 中点击添加按钮时：

1.  `dispatch` 触发 -> `tasks` 状态更新。
2.  `App` 重渲染。
3.  `TasksContext` 的值变了 -> **`<TaskList />` 重渲染** (符合预期)。
4.  `TasksDispatchContext` 的值**没变** (dispatch 是稳定的)。
5.  `<AddTask />` 检测到：
    *   Props 没变。
    *   消费的 Context 没变。
    *   **结论：`<AddTask />` 跳过渲染，保持静止。**

通过这种方式，我们成功切断了“数据变化”对“操作组件”的渲染污染，在大规模应用中能显著减少不必要的 Render 开销。
