import React, { useReducer, useContext, useState, memo } from 'react';
import { TasksContext, TasksDispatchContext, Task, Action } from './TasksContext';

// --- Reducer 逻辑 (纯函数，易测试) ---
function tasksReducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'added': {
      return [
        ...tasks,
        {
          id: action.id,
          text: action.text,
          done: false,
        },
      ];
    }
    case 'changed': {
      return tasks.map((t) => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter((t) => t.id !== action.id);
    }
    default: {
      throw new Error('Unknown action: ' + (action as any).type);
    }
  }
}

let nextId = 3;
const initialTasks: Task[] = [
  { id: 0, text: 'Philosopher’s Path', done: true },
  { id: 1, text: 'Visit the temple', done: false },
  { id: 2, text: 'Drink matcha', done: false },
];

// --- 子组件 1: AddTask ---
// 💡 性能优化关键点：
// 这个组件只使用了 TasksDispatchContext。
// 因为 dispatch 是稳定的（永远不会变），所以当 TasksContext (任务列表) 变化时，
// 只要父组件传递给它的 props 没变（这里没有 props），AddTask 就不会重新渲染。
const AddTask = memo(() => {
  // TODO: 因为 dispatch 是稳定的（永远不会变），当Add按钮之后， TasksContext (任务列表) 变化时，Props和Dispatch都没有变化，所以AddTask不会重新渲染
  console.log('Component rendered: <AddTask /> (如果Add之后,没有打印,说明优化成功)');
  
  const [text, setText] = useState('');
  const dispatch = useContext(TasksDispatchContext);

  if (!dispatch) return null;

  return (
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px dashed #ccc' }}>
      <h4>添加任务组件 (只依赖 Dispatch)</h4>
      <input
        placeholder="Add task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginRight: '8px', padding: '4px' }}
      />
      <button
        onClick={() => {
          // TODO: 这里不清空，因为清空了组件状态更新，也会导致重新渲染，判断不了Context优化有没有生效
          // setText('');
          dispatch({
            type: 'added',
            id: nextId++,
            text: text,
          });
        }}
      >
        Add
      </button>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        Try typing or adding. Check console to see if I re-render.
      </div>
    </div>
  );
});

// --- 子组件 2: TaskList ---
// 这个组件使用了 TasksContext，所以每次任务列表变化，它必须重新渲染。
const TaskList = () => {
  console.log('Component rendered: <TaskList />');
  const tasks = useContext(TasksContext);

  if (!tasks) return null;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {tasks.map((task) => (
        <li key={task.id} style={{ marginBottom: '8px' }}>
          <TaskItem task={task} />
        </li>
      ))}
    </ul>
  );
};

// --- 子组件 3: TaskItem ---
const TaskItem = ({ task }: { task: Task }) => {
  const dispatch = useContext(TasksDispatchContext);
  
  if (!dispatch) return null;

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => {
          dispatch({
            type: 'changed',
            task: {
              ...task,
              done: e.target.checked,
            },
          });
        }}
      />
      {task.text}
      <button
        onClick={() => {
          dispatch({
            type: 'deleted',
            id: task.id,
          });
        }}
        style={{ marginLeft: 'auto', fontSize: '12px' }}
      >
        Delete
      </button>
    </label>
  );
};

// --- 主组件: TaskApp ---
export default function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

  return (
    // 💡 技巧：将 State 和 Dispatch 分开提供
    // 这样，只消费 Dispatch 的组件（如 AddTask）就不需要订阅 State 的变化
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        <div style={{ padding: '20px', maxWidth: '400px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Context + useReducer 性能优化 Demo</h2>
          <p style={{ fontSize: '14px', color: '#555' }}>
            Open console to see render logs.
          </p>
          
          <AddTask />
          
          <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '10px' }}>
            <h4>任务列表组件 (依赖 Data)</h4>
            <TaskList />
          </div>
        </div>
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}
