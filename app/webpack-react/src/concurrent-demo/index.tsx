import React, { useState, useTransition } from 'react';

// 模拟耗时组件：通过强制死循环阻塞主线程
const HeavyList = ({ query }: { query: string }) => {
  // 渲染一次阻塞 50ms，模拟非常重的组件
  // 如果没有并发模式，用户输入时会感到明显的输入延迟
  const startTime = performance.now();
  while (performance.now() - startTime < 50) {
    // 阻塞中...
  }

  const items: React.ReactNode[] = [];
  // 生成大量节点
  for (let i = 0; i < 2000; i++) {
    // 简单的过滤逻辑
    if (query !== '' && !String(i).includes(query)) {
        continue;
    }
    items.push(
      <li key={i} style={{ padding: '2px 0', borderBottom: '1px solid #eee' }}>
        Result Item #{i} (Filter: {query})
      </li>
    );
  }

  return (
    <div style={{ height: '300px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
      <h3>列表结果 (渲染耗时: ~50ms)</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>{items}</ul>
    </div>
  );
};

const ConcurrentDemo = () => {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [isConcurrent, setIsConcurrent] = useState(true);
  
  // useTransition 返回两个值：
  // isPending: 布尔值，表示是否有低优先级的更新正在等待中
  // startTransition: 函数，用于将更新标记为"非紧急"（Transition）
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 1. 紧急更新：输入框必须立即回显，否则用户会觉得"卡手"
    // 这个更新是高优先级的 (Urgent Update)
    setValue(newValue);

    if (isConcurrent) {
      // 2. 并发模式：将重列表的过滤更新标记为 Transition
      // 这是一个低优先级更新，React 允许它被高优先级任务（如下一次键盘输入）打断
      startTransition(() => {
        setQuery(newValue);
      });
    } else {
      // 3. 同步模式：直接更新。React 18 在默认情况下会进行自动批处理(Auto Batching)，
      // 但这里我们主要对比的是 Transition 的效果。
      // 在没有 startTransition 的情况下，这次更新和 setValue 一样是紧急的。
      // 浏览器必须等 HeavyList 渲染完（阻塞50ms）才能响应下一次输入。
      setQuery(newValue);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>React 18 并发渲染 Demo</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        演示 <code>useTransition</code> 如何解决复杂渲染导致的页面卡顿。
      </p>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isConcurrent} 
            onChange={e => setIsConcurrent(e.target.checked)} 
            style={{ width: '20px', height: '20px', marginRight: '10px' }}
          />
          <span style={{ fontWeight: 'bold' }}>开启并发模式 (useTransition)</span>
        </label>
        <p style={{ marginTop: '5px', fontSize: '14px' }}>
          {isConcurrent 
            ? '✅ 开启后：输入框响应流畅，列表渲染在后台进行，不会阻塞输入。' 
            : '❌ 关闭后：输入框会卡顿，因为每次输入都要等列表渲染完。'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={value} 
          onChange={handleChange}
          placeholder="快速输入数字 (如 123) 来测试卡顿..."
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '18px', 
            border: '2px solid #1890ff', 
            borderRadius: '4px' 
          }}
        />
      </div>

      <div style={{ minHeight: '20px', marginBottom: '10px' }}>
        {isPending && (
          <span style={{ color: '#faad14', fontWeight: 'bold' }}>
            ⏳ 列表渲染中... (此时界面仍可响应交互)
          </span>
        )}
      </div>
      
      <HeavyList query={query} />
    </div>
  );
};

export default ConcurrentDemo;
