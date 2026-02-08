import { createContext, Dispatch } from 'react';

export interface Task {
  id: number;
  text: string;
  done: boolean;
}

export type Action =
  | { type: 'added'; id: number; text: string }
  | { type: 'changed'; task: Task }
  | { type: 'deleted'; id: number };

// 1. 创建存放数据的 Context
export const TasksContext = createContext<Task[] | null>(null);

// 2. 创建存放 Dispatch 的 Context
// Dispatch 的类型是 React.Dispatch<Action>
export const TasksDispatchContext = createContext<Dispatch<Action> | null>(null);
