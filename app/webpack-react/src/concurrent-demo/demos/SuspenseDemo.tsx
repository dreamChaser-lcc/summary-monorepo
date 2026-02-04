import React, { Suspense, useState } from 'react';

// 模拟 API 请求资源
// 这是一个简单的 "Suspense Resource" 实现
function wrapPromise(promise: Promise<any>) {
  let status = 'pending';
  let result: any;
  let suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    }
  );
  return {
    read() {
      if (status === 'pending') {
        // 核心机制：抛出 Promise，让 React 捕获并挂起渲染
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}

// 模拟 API
function fetchUser(id: number) {
  console.log('fetch user', id);
  return new Promise<{ id: number; name: string; email: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        name: `User ${id} (Ringo)`,
        email: `user${id}@example.com`
      });
    }, 2000); // 延迟 2秒
  });
}

// 资源缓存（简化版）
const resourceCache = new Map();

function getResource(id: number) {
  if (!resourceCache.has(id)) {
    resourceCache.set(id, wrapPromise(fetchUser(id)));
  }
  return resourceCache.get(id);
}

// 数据展示组件 - 它尝试直接"读取"数据，如果没读到会由 Resource 抛出异常
const UserProfile = ({ id }: { id: number }) => {
  const resource = getResource(id);
  const user = resource.read(); // 这里可能会 throw Promise

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
      <h3>用户信息 (ID: {user.id})</h3>
      <p>Name: <strong>{user.name}</strong></p>
      <p>Email: {user.email}</p>
    </div>
  );
};

// Loading 组件
const Loading = () => (
  <div style={{ padding: '20px', color: '#1890ff', fontWeight: 'bold' }}>
    🌀 正在加载用户信息 (Suspense fallback)...
  </div>
);

const SuspenseDemo = () => {
  const [userId, setUserId] = useState(1);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Suspense Demo</h2>
      <p>Suspense 允许组件在等待数据时"挂起"，并显示 Fallback UI。</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setUserId((id) => id + 1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          加载下一个用户 (ID: {userId + 1})
        </button>
      </div>

      <div style={{ minHeight: '150px' }}>
        {/* 
          Suspense 边界：
          当 UserProfile 内部 throw Promise 时，
          React 会向上寻找最近的 Suspense，并渲染 fallback
        */}
        <Suspense fallback={<Loading />}>
          <UserProfile id={userId} />
        </Suspense>
      </div>
    </div>
  );
};

export default SuspenseDemo;
