import React, { Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
// 将 About 改为懒加载
// 注意：服务端渲染时，React.lazy 会导致 Suspense 挂起，服务端会先发送 fallback
const About = React.lazy(() => import('./pages/About'));
import Profile from './pages/Profile';

interface AppProps {
  data?: any;
}

const App: React.FC<AppProps> = ({ data }) => {
  // 我们手动构建 Routes，以便传递 data
  // 在真实项目中，这里通常会使用 Context 来传递数据，或者每个组件自己从 window.__INITIAL_DATA__ 获取
  // 但为了简单演示，我们还是通过 props 传递
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h2>React SSR with Router Demo</h2>
        <nav>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/about" style={{ marginRight: '10px' }}>About (Lazy)</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home data={data} />} />
          <Route path="/about" element={
            <Suspense fallback={<div style={{ padding: '20px', color: '#666' }}>Loading About component... (Streaming)</div>}>
              <About data={data} />
            </Suspense>
          } />
          <Route path="/profile" element={<Profile data={data} />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
