# React 高级设计模式与进阶用法指南

本文档深入探讨 React 开发中常见的高级设计模式。掌握这些模式可以帮助你编写出更具复用性、灵活性和可维护性的组件库或业务代码。

## 一、 复合组件模式 (Compound Components)

**核心思想**：通过隐式的状态共享，让一组子组件协同工作。使用者可以灵活控制子组件的布局和内容，而不需要通过 props 传递复杂的配置。

### 1. 场景
比如 `<Select>`, `<Tabs>`, `<Menu>` 等组件，父组件需要管理状态（选中项），子组件负责渲染具体选项。

### 2. 实现原理
利用 `Context` API 在父组件和子组件之间共享状态。

### 3. 代码示例：实现一个 Tabs 组件

```tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

// 1. 创建 Context
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
} | null>(null);

// 2. 父组件
export const Tabs = ({ children, defaultActive }: { children: ReactNode; defaultActive: string }) => {
  const [activeTab, setActiveTab] = useState(defaultActive);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

// 3. 子组件：TabList
Tabs.List = ({ children }: { children: ReactNode }) => {
  return <div className="tabs-list">{children}</div>;
};

// 4. 子组件：TabTrigger (点击切换)
Tabs.Trigger = ({ id, children }: { id: string; children: ReactNode }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.Trigger must be used within Tabs");
  
  const isActive = context.activeTab === id;
  return (
    <button
      onClick={() => context.setActiveTab(id)}
      style={{ fontWeight: isActive ? "bold" : "normal", color: isActive ? "blue" : "black" }}
    >
      {children}
    </button>
  );
};

// 5. 子组件：TabContent (内容展示)
Tabs.Content = ({ id, children }: { id: string; children: ReactNode }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs.Content must be used within Tabs");

  if (context.activeTab !== id) return null;
  return <div className="tabs-content">{children}</div>;
};

// 6. 使用方式
function App() {
  return (
    <Tabs defaultActive="tab1">
      <Tabs.List>
        <Tabs.Trigger id="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger id="tab2">Tab 2</Tabs.Trigger>
      </Tabs.List>
      <hr />
      <Tabs.Content id="tab1">Content of Tab 1</Tabs.Content>
      <Tabs.Content id="tab2">Content of Tab 2</Tabs.Content>
    </Tabs>
  );
}
```

---

## 二、 控制属性模式 (Control Props Pattern)

**核心思想**：让组件“既支持受控，也支持非受控”。这是一种非常健壮的组件设计方式，React 原生的 `<input>` 就是这个模式。

### 1. 场景
当你开发一个通用组件（如 `Counter`, `Toggle`, `Input`）时，使用者可能想要自己管理状态（受控），也可能想直接用（非受控）。

### 2. 实现原理
内部判断 `props.value` 是否存在：
*   如果存在 -> 使用 `props.value` (受控)。
*   如果不存在 -> 使用内部 `state` (非受控)。

### 3. 代码示例：通用计数器

```tsx
import { useState, useEffect } from "react";

interface CounterProps {
  value?: number;          // 受控属性
  defaultValue?: number;   // 非受控初始值
  onChange?: (val: number) => void;
}

export function Counter({ value: controlledValue, defaultValue = 0, onChange }: CounterProps) {
  // 判断是否受控：只要传了 value 属性，就是受控模式
  const isControlled = controlledValue !== undefined;

  // 内部状态（只在非受控模式下生效）
  const [internalValue, setInternalValue] = useState(defaultValue);

  // 获取当前真实值
  const value = isControlled ? controlledValue : internalValue;

  const handleIncrement = () => {
    const nextValue = value + 1;
    
    // 如果是非受控，更新内部 state
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    
    // 无论哪种模式，都要触发 onChange 通知父组件
    onChange?.(nextValue);
  };

  return (
    <button onClick={handleIncrement}>
      Count: {value}
    </button>
  );
}

// 使用方式
function App() {
  // 1. 非受控用法 (简单)
  // <Counter defaultValue={10} />

  // 2. 受控用法 (强大)
  const [count, setCount] = useState(0);
  return <Counter value={count} onChange={setCount} />;
}
```

---

## 三、 Render Props (渲染属性)

**核心思想**：将“渲染什么”的逻辑通过一个函数 prop 传递给子组件。子组件只负责逻辑处理，父组件决定如何展示。

### 1. 场景
逻辑复用。比如：监听鼠标位置、检测滚动高度、表单校验逻辑等。

### 2. 代码示例：鼠标追踪器

```tsx
import { useState, MouseEvent, ReactNode } from "react";

interface MouseTrackerProps {
  // 核心：render 是一个函数，接收 state，返回 JSX
  render: (position: { x: number; y: number }) => ReactNode;
}

export const MouseTracker = ({ render }: MouseTrackerProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: MouseEvent) => {
    setPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div style={{ height: "100vh" }} onMouseMove={handleMouseMove}>
      {/* 将内部 state 暴露给外部 */}
      {render(position)}
    </div>
  );
};

// 使用方式
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <h1>
          The mouse position is ({x}, {y})
        </h1>
      )}
    />
  );
}
```

---

## 四、 高阶组件 (HOC) - 切面编程

**核心思想**：一个函数，接收一个组件，返回一个新的组件。主要用于逻辑复用和切面编程（AOP）。

### 1. 场景
权限控制（withAuth）、日志上报（withLogger）、统一布局（withLayout）。

### 2. 代码示例：权限控制 HOC

```tsx
import React, { ComponentType, useEffect, useState } from "react";

// 模拟 Auth Hook
const useAuth = () => {
  return { isLogin: localStorage.getItem("token") !== null };
};

// HOC 定义
export function withAuth<T extends object>(WrappedComponent: ComponentType<T>) {
  return (props: T) => {
    const { isLogin } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // 模拟检查登录状态
      setTimeout(() => setIsLoading(false), 500);
    }, []);

    if (isLoading) return <div>Checking auth...</div>;

    if (!isLogin) {
      return <div>Please Login First</div>;
    }

    // 登录成功，渲染原组件，并透传 props
    return <WrappedComponent {...props} />;
  };
}

// 使用方式
const Dashboard = ({ name }: { name: string }) => <h1>Welcome, {name}</h1>;
const ProtectedDashboard = withAuth(Dashboard);

// <ProtectedDashboard name="Admin" />
```

---

## 五、 自定义 Hook 工厂 (Hook Factory)

**核心思想**：不直接写死 Hook，而是编写一个“生成 Hook 的函数”。

### 1. 场景
当你有多个类似的业务模块（比如多个不同的 Store，或者多个类似的 API 请求逻辑）时。

### 2. 代码示例：简单的 Store 工厂

```tsx
import { useState, useEffect } from "react";

// 工厂函数：创建一个微型状态管理器
function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<(val: T) => void>();

  const setState = (newValue: T) => {
    state = newValue;
    listeners.forEach((listener) => listener(state));
  };

  // 返回一个 Hook
  return () => {
    const [currentState, setCurrentState] = useState(state);

    useEffect(() => {
      const listener = (val: T) => setCurrentState(val);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    return [currentState, setState] as const;
  };
}

// 使用方式
// 1. 创建 Store
const useCountStore = createStore(0);

// 2. 在任意组件中使用，状态自动同步
function CounterA() {
  const [count, setCount] = useCountStore();
  return <button onClick={() => setCount(count + 1)}>A: {count}</button>;
}

function CounterB() {
  const [count] = useCountStore();
  return <div>B: {count}</div>;
}
```

---

## 六、 按钮权限控制最佳实践 (Permission Control)

**核心思想**：将权限判断逻辑集中封装，而不是散落在各个业务组件中。

### 1. 基础架构：PermissionContext

首先，我们需要一个全局的地方存放当前用户的权限列表。

```tsx
import React, { createContext, useContext, ReactNode } from 'react';

// 假设权限列表是一个字符串数组，如 ['user:add', 'user:edit']
const PermissionContext = createContext<string[]>([]);

export const PermissionProvider = ({ permissions, children }: { permissions: string[], children: ReactNode }) => {
  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  );
};

// 暴露 Hook 供组件查询
export const usePermission = () => {
  const permissions = useContext(PermissionContext);
  
  // 核心鉴权函数：判断是否拥有某个（或某些）权限
  const hasAuth = (code: string | string[], matchType: 'AND' | 'OR' = 'OR') => {
    if (!code || code.length === 0) return true;
    const codes = Array.isArray(code) ? code : [code];
    
    if (matchType === 'OR') {
      return codes.some(c => permissions.includes(c));
    }
    return codes.every(c => permissions.includes(c));
  };

  return { permissions, hasAuth };
};
```

### 2. 方案 A：封装鉴权组件 `<Auth>` (推荐)

最常用的方式，通过包裹组件来控制显隐。

```tsx
interface AuthProps {
  code: string | string[]; // 需要的权限码
  fallback?: ReactNode;    // 无权限时的占位符（比如显示一个锁图标，或者 null）
  children: ReactNode;
}

export const Auth = ({ code, fallback = null, children }: AuthProps) => {
  const { hasAuth } = usePermission();
  
  // 如果有权限，渲染子组件；否则渲染 fallback
  return hasAuth(code) ? <>{children}</> : <>{fallback}</>;
};

// 使用示例
function UserPage() {
  return (
    <div>
      <h1>用户列表</h1>
      
      {/* 只有拥有 'user:add' 权限才显示按钮 */}
      <Auth code="user:add">
        <button>新增用户</button>
      </Auth>

      {/* 无权限时显示禁用态 */}
      <Auth 
        code="user:delete" 
        fallback={<button disabled>删除(无权)</button>}
      >
        <button>删除</button>
      </Auth>
    </div>
  );
}
```

### 3. 方案 B：高阶组件 (HOC)

适用于粗粒度的页面级控制，或者不想在 JSX 里写太多 `<Auth>` 的情况。

```tsx
export function withPermission<P extends object>(
  Component: React.ComponentType<P>, 
  code: string
) {
  return (props: P) => {
    const { hasAuth } = usePermission();
    if (!hasAuth(code)) return null; // 或者返回 <403Page />
    return <Component {...props} />;
  };
}
```

### 4. 方案 C：在逻辑中使用 Hook

有时我们不仅要控制显隐，还要控制点击后的行为（比如点击按钮弹出“您没有权限”的 Toast）。

```tsx
function ExportButton() {
  const { hasAuth } = usePermission();

  const handleClick = () => {
    if (!hasAuth('data:export')) {
      alert('您没有导出权限，请联系管理员');
      return;
    }
    // 执行导出逻辑...
  };

  return <button onClick={handleClick}>导出数据</button>;
}
```

