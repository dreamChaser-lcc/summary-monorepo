'use client';

import React, { useState } from 'react';

export const BffDemo = () => {
  const [userId, setUserId] = useState('1');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 请求我们自己的 Next.js BFF 接口
      // 浏览器 -> Next.js API (BFF) -> 真实数据源
      const res = await fetch(`/api/user-bff?id=${userId}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch user', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-purple-200 mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🛡️</span>
        <h2 className="text-xl font-bold text-purple-900">Next.js BFF 中间层示例</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        点击按钮请求 <code>/api/user-bff</code>。
        Next.js 后端会模拟获取包含敏感数据（如工资、IP）的原始用户数据，
        然后进行<b>裁剪和格式化</b>，只返回安全的数据给前端。
      </p>

      <div className="flex gap-4 items-center mb-6">
        <select 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="1">用户 Alice (ID: 1)</option>
          <option value="2">用户 Bob (ID: 2)</option>
          <option value="3">不存在的用户 (ID: 3)</option>
        </select>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '请求中...' : '请求 BFF 接口'}
        </button>
      </div>

      {data && (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto">
          <div className="mb-2 text-gray-400 border-b border-gray-700 pb-2">
            // 响应来自: {window.location.origin}/api/user-bff
          </div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          
          <div className="mt-4 pt-4 border-t border-gray-700 text-green-400">
            <p>✨ 观察点：</p>
            <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-300">
              <li>原始数据中的 <code>salary</code> (工资) 已被移除</li>
              <li>原始数据中的 <code>last_login_ip</code> 已被移除</li>
              <li>新增了聚合字段 <code>publicProfile</code></li>
              <li>数据结构被重组了</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
