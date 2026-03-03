import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import NavigateSetter from './components/NavigateSetter';
import { historyPush } from './utils/history';

const initialData = (window as any).__INITIAL_DATA__ || {};

// 我们将 NavigateSetter 放在 App 之前，确保它能第一时间获取 navigate 实例
// 但它必须在 BrowserRouter 内部
hydrateRoot(
  document.getElementById('root')!,
  <BrowserRouter>
    <NavigateSetter />
    <App data={initialData} />
  </BrowserRouter>
);

// 验证：模拟在组件外部调用跳转
// 在控制台输入 window.jumpToProfile() 即可测试
(window as any).jumpToProfile = () => {
  console.log('Jumping to profile via global historyPush...');
  historyPush('/profile');
};

console.log('Global navigation ready! Try running `window.jumpToProfile()` in console.');
