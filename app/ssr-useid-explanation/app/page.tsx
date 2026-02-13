import Image from "next/image";
import { UseIdDemo } from "../components/UseIdDemo";
import { BffDemo } from "../components/BffDemo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black pb-32">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            React SSR & BFF Demo
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Next.js 既解决了 SSR 的 ID 一致性问题 (useId)，也提供了强大的 BFF 中间层能力。
          </p>
        </div>
        
        {/* BFF 演示部分 */}
        <div className="w-full mt-10">
          <BffDemo />
        </div>

        {/* useId 演示部分 */}
        <div className="w-full mt-10">
          <UseIdDemo />
        </div>

        <div className="mt-10 text-left text-zinc-600 dark:text-zinc-400 max-w-xl">
          <h3 className="font-bold text-lg mb-2">为什么需要 useId?</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>SSR 一致性：</strong> 如果在服务端和客户端分别使用 Math.random()，生成的 ID 会不一致，导致 React 报错（Hydration Mismatch）。useId 保证了两端生成的 ID 是一样的。
            </li>
            <li>
              <strong>无障碍访问 (Accessibility)：</strong> 方便地生成唯一的 ID 用于 <code>aria-describedby</code> 和 <code>htmlFor</code>，提升屏幕阅读器体验。
            </li>
            <li>
              <strong>组件复用：</strong> 即使同一个组件在页面上渲染多次，每次调用的 useId 都会返回不同的值，不会造成 ID 冲突。
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
