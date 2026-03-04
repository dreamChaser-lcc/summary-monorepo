import ServerData from './components/ServerData';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-8">
        React Server Components Demo
      </h1>
      
      <div className="max-w-3xl w-full space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            How it works:
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>
              The <code className="bg-gray-100 px-2 py-1 rounded text-red-500">ServerData</code> component 
              is rendered entirely on the server. Its code is NEVER sent to the browser.
            </li>
            <li>
              The data fetching happens directly inside the component (using async/await).
            </li>
            <li>
              The <code className="bg-gray-100 px-2 py-1 rounded text-blue-500">Counter</code> component 
              is a Client Component ("use client"). It gets hydrated in the browser to become interactive.
            </li>
          </ul>
        </section>

        {/* 引入服务端组件 */}
        {/* React Server Components 支持 Suspense 流式渲染 */}
        <ServerData />
      </div>
    </div>
  );
}
