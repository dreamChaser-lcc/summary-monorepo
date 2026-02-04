import React, { useState, useDeferredValue, memo } from 'react';

// 模拟耗时组件
const HeavyList = memo(({ query }: { query: string }) => {
  // 模拟耗时操作：阻塞主线程
  const startTime = performance.now();
  while (performance.now() - startTime < 50) {
    // 阻塞 50ms
  }

  const items: React.ReactNode[] = [];
  for (let i = 0; i < 2000; i++) {
    if (query !== '' && !String(i).includes(query)) {
        continue;
    }
    items.push(<li key={i}>Item {i}</li>);
  }

  return (
    <div style={{ opacity: 0.5 }}>
        <p>列表结果 (基于延迟值渲染: "{query}")</p>
        <ul style={{ height: '200px', overflow: 'auto' }}>{items}</ul>
    </div>
  );
});

const DeferredValueDemo = () => {
  const [value, setValue] = useState('');
  
  // useDeferredValue: 创建一个延迟版本的 value
  // React 会在处理完高优先级更新（如输入框回显）后，
  // 再在空闲时间处理 deferredValue 的更新。
  const deferredValue = useDeferredValue(value);

  // 比较原始值和延迟值，可以用来显示"加载中"状态
  const isStale = value !== deferredValue;

  return (
    <div style={{ padding: '20px' }}>
      <h2>useDeferredValue Demo</h2>
      <p>
        输入框是实时响应的 (value)，而列表是基于延迟值 (deferredValue) 渲染的。
      </p>
      
      <input 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="快速输入数字..."
        style={{ padding: '8px', width: '300px', marginBottom: '10px' }}
      />

      <div style={{ color: isStale ? 'red' : 'green', marginBottom: '10px' }}>
        状态: {isStale ? `⏳ 正在计算列表 (Value: ${value}, Deferred: ${deferredValue})` : '✅ 同步完成'}
      </div>

      {/* 这里的列表只依赖 deferredValue，所以输入框更新时它不会立即重绘 */}
      <HeavyList query={deferredValue} />
    </div>
  );
};

export default DeferredValueDemo;
