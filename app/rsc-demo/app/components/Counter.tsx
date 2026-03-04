// 这是一个客户端组件 (Client Component)
// 必须在文件顶部声明 "use client"
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded bg-gray-100 mt-4">
      <h3 className="text-lg font-bold text-black">Client Component (Interactive)</h3>
      <p className="text-black">Count: {count}</p>
      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
