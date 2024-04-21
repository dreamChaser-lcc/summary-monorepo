import React, { lazy, ReactNode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
    // history路由 
    createBrowserRouter,
    BrowserRouter,
    RouteObject,
    RouterProvider,
    // hash路由
    createHashRouter,
    Navigate,
    useRoutes,
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
          // element: LazyLoad(),
          async lazy() {
            // const LazyLoad = (path) => { //传入在view 下的路径
            //   const Comp = React.lazy(() =>  import(/* webpackChunkName: "my-chunk-name" */ '@/vw-transform-page/qr-code'))
            //     return (
            //         <React.Suspense fallback={<> 加载中...</>}>
            //             <Comp />
            //         </React.Suspense>
            //     )
            // }
            // let  VwQrCode = lazy(() => import(/* webpackChunkName: "my-chunk-name" */ '@/vw-transform-page/qr-code'))
            const { VwQrCode } = await import (/* webpackChunkName: "vw-qr-code" */ '@/vw-transform-page/qr-code');
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

// 使用hooks方式注册路由
// const RenderRouter =()=>useRoutes(routers);
// root.render(<BrowserRouter><RenderRouter/></BrowserRouter>);