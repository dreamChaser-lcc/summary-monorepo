// 这是一个服务端组件 (Server Component)
// Next.js 13+ (App Router) 中，所有组件默认都是服务端组件
// 不需要 "use server" 或 "use client" 声明（除非你想显式声明 Server Actions）

import Counter from './Counter';

// 模拟数据库查询
async function getData() {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    title: 'Hello from Server Component',
    description: 'This data was fetched on the server and sent as HTML/JSON.',
    timestamp: new Date().toISOString(),
  };
}

export default async function ServerData() {
  // 在组件内部直接 await 数据！
  const data = await getData();

  return (
    <div className="p-6 border-2 border-green-500 rounded-lg bg-white shadow-lg">
      <h2 className="text-2xl font-bold text-green-700">Server Component (RSC)</h2>
      <div className="mt-4 space-y-2 text-gray-700">
        <p><strong>Title:</strong> {data.title}</p>
        <p><strong>Description:</strong> {data.description}</p>
        <p><strong>Server Time:</strong> {data.timestamp}</p>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800 mb-2">
          👇 Below is a Client Component embedded in a Server Component.
          <br/>
          The server component renders the initial HTML, and the client component becomes interactive after hydration.
        </p>
        {/* 在服务端组件中引入并使用客户端组件 */}
        <Counter />
      </div>
    </div>
  );
}
