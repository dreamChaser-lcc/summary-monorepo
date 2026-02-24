'use client';

import React, { useId, useState } from 'react';

export const UseIdDemo = () => {
  // ✅ 正确做法：使用 useId
  // 无论是在服务端还是客户端，它都会根据组件结构生成稳定的 ID
  const safeId = useId();

  // ❌ 错误做法：使用 Math.random()
  // 在 SSR 过程中：
  // 1. 服务端执行组件 -> 生成随机数 A -> 输出 HTML <input id="A" />
  // 2. 浏览器下载 HTML -> 显示 id="A"
  // 3. 浏览器执行 JS (Hydration) -> 生成随机数 B -> React 期望 <input id="B" />
  // 4. 结果：React 发现现有 DOM 是 A 但它想要 B -> 报错 (Hydration Mismatch)
  const unsafeId = `unsafe-${Math.random().toString(36).slice(2, 7)}`;

  const [email, setEmail] = useState('');

  return (
    <div className="space-y-8 w-full max-w-2xl mx-auto">
      
      {/* 🟢 正确示例部分 */}
      <div className="p-6 bg-green-50 rounded-xl shadow-sm border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✅</span>
          <h2 className="text-xl font-bold text-green-900">正确做法 (useId)</h2>
        </div>
        <p className="text-sm text-green-800 mb-6 leading-relaxed">
          <code>useId</code> 生成的 ID 在服务端和客户端是完全一致的（例如 <code>{safeId}</code>）。
          React 依据组件在树中的层级位置来计算这个 ID，而不是依赖随机数。
        </p>
        
        <form className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-green-100">
          <div className="flex flex-col gap-1">
            <label 
              htmlFor={`${safeId}-email`} 
              className="text-sm font-medium text-gray-700"
            >
              邮箱地址 <span className="text-xs text-gray-400 font-mono">(for="{safeId}-email")</span>
            </label>
            <input
              id={`${safeId}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
              focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              aria-describedby={`${safeId}-hint`}
            />
            <p 
              id={`${safeId}-hint`} 
              className="text-xs text-gray-500"
            >
              辅助文本 ID: {`${safeId}-hint`}
            </p>
          </div>
        </form>
      </div>

      {/* 🔴 错误示例部分 */}
      <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">❌</span>
          <h2 className="text-xl font-bold text-red-900">错误做法 (Math.random)</h2>
        </div>
        <div className="text-sm text-red-800 mb-6 leading-relaxed">
          <p className="mb-2">
            这里使用了 <code>Math.random()</code> 生成 ID。
          </p>
          <div className="bg-red-100 p-3 rounded text-xs font-mono border border-red-200">
            当前生成的 ID: <strong>{unsafeId}</strong>
          </div>
          <p className="mt-2 font-bold">
            ⚠️ 请刷新页面并打开浏览器控制台 (F12 -&gt; Console)
          </p>
          <p className="mt-1">
            你会看到类似 <code>Prop `id` did not match. Server: "unsafe-xyz" Client: "unsafe-abc"</code> 的 Hydration 错误警告。
          </p>
        </div>
        
        <form className="flex flex-col gap-4 p-4 bg-white rounded-lg border border-red-100">
          <div className="flex flex-col gap-1">
            <label 
              htmlFor={`${unsafeId}-input`} 
              className="text-sm font-medium text-gray-700"
            >
              不稳定输入框 <span className="text-xs text-gray-400 font-mono">(for="{unsafeId}-input")</span>
            </label>
            <input
              id={`${unsafeId}-input`}
              type="text"
              placeholder="ID 不匹配会导致关联失效或报错"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm 
              focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </form>
      </div>

    </div>
  );
};
