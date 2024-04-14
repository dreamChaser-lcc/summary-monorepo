import React, { lazy, ReactNode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
    // history路由 
    createBrowserRouter,
    RouteObject,
    RouterProvider,
    // hash路由
    createHashRouter,
    Navigate
  } from "react-router-dom";
import RemQrCode from '@/rem-transform-page/qr-code';
import TestCommonUtils from '@/rem-transform-page/test-common-utils';
import App from '@/app';

// 路由配置
const routers:RouteObject[] = [
    {
      path: "/",
      element: <App></App>,
      children: [
        {
          path: "/",
          // 根目录路由重定向, 借助Navigate组件跳转
          element: <Navigate to="rem" replace />,
        },
        {
          path: "rem",
          index: true,
          element:<RemQrCode/>
        },
        {
          path: "rem-test-common-utils",
          element:<TestCommonUtils/>
        },
        {
          // 懒加载 vw移动端适配方案
          path: "vw",
          async lazy() {
            // let  VwQrCode = lazy(() => import(/* webpackChunkName: "my-chunk-name" */ '@/vw-transform-page/qr-code'))
            const { VwQrCode } = await import ('@/vw-transform-page/qr-code');
            return {
              // loader: messagesLoader,
              Component: VwQrCode,
            };
          },
        }
      ]
    },
]

const router = createHashRouter(routers);

const root = createRoot(document.getElementById('root')!);

root.render(<RouterProvider router={router} />);