import React from 'react';
import Home from './pages/Home';
import About from './pages/About';
import Profile from './pages/Profile';

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  loadData?: () => Promise<any>;
}

const routes: RouteConfig[] = [
  {
    path: '/',
    component: Home,
    loadData: () => {
      // 模拟异步数据请求
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            title: 'Home Page Data from Server',
            content: 'This data was fetched on the server before rendering Home component.'
          });
        }, 100);
      });
    }
  },
  {
    path: '/about',
    component: About,
    loadData: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            message: 'About Page Data from Server',
            description: 'This is some data for the About page.'
          });
        }, 100);
      });
    }
  },
  {
    path: '/profile',
    component: Profile,
    // 注意：这里我们故意不写 loadData，而是通过 Express 中间件来注入数据
  }
];

export default routes;
