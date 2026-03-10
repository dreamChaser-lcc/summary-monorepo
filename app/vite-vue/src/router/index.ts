import {
  createRouter,
  createWebHashHistory,
  RouteRecordRaw,
  // createMemoryHistory,
  createWebHistory,
} from 'vue-router';
import HelloWorld from '@/components/HelloWorld.vue';

export const routes: RouteRecordRaw[] = [
  { path: '', name: 'un-matched', component: () => import('@/view/menu/index.vue') },
  { path: '/hello-world', name: 'hello-world', component: HelloWorld },
  // 发布订阅模式
  {
    path: '/event-bus',
    name: 'event-bus',
    component: () => import('@/view/event-bus/index.vue'),
    meta: { title: '发布订阅模式' },
  },
  // 观察者模式
  {
    path: '/observer-mode',
    name: 'observer-mode',
    component: () => import('@/view/observer-mode/index.vue'),
    meta: { title: '观察者模式' },
  },
  // pinia和vuex状态管理使用
  {
    path: '/store-use',
    name: 'store-use',
    component: () => import('@/view/store-use/index.vue'),
    meta: { title: 'pinia和vuex状态管理' },
  },
  {
    path: '/tailwind-use',
    name: 'tailwind-use',
    component: () => import('@/view/tailwind-use/index.vue'),
    meta: {
      title: 'tailwind引入',
    },
  },
  // 分片上传
  {
    path: '/split-upload',
    name: 'split-upload',
    component: () => import('@/view/split-upload/index.vue'),
    meta: { title: '分片上传' },
  },
  {
    path: '/layout-sample',
    name: 'layout-sample',
    component: () => import('@/view/layout-sample/index.vue'),
    meta: { title: '布局组件调试' },
  },
  {
    path: '/tsx-example',
    name: 'tsx-example',
    component: () => import('@/view/tsx-example'),
    meta: { title: '在vue中使用tsx语法' },
  },
  {
    path: '/proxy-sample',
    name: 'proxy-sample',
    component: () => import('@/view/proxy-sample/index.vue'),
    meta: { title: '微前端qiankunjs隔离方案demo' },
  },
  {
    path: '/vue-api-usage',
    name: 'vue-api-usage',
    component: () => import('@/view/vue-api-usage/index.vue'),
    meta: { title: 'vue模式api使用' },
  },
  {
    path: '/virtual-scroll',
    name: 'virtual-scroll',
    component: () => import('@/view/virtual-scroll/index.vue'),
    meta: { title: '虚拟滚动原理实现(简易版 快速拉动会白屏)' },
  },
  {
    path: '/virtua-demo',
    name: 'virtua-demo',
    component: () => import('@/view/virtua-demo/index.vue'),
    meta: { title: 'virtua库虚拟列表demo' },
  },
  {
    path: '/virtual-scroll-virtua',
    name: 'virtual-scroll-virtua',
    component: () => import('@/components/virtual-scroll-virtua/index.vue'),
    meta: { title: 'Virtua原理重写版' },
  },
];

export const router = createRouter({
  history: createWebHistory(), // 刷新后需要重定向到入口路径
  // history: createMemoryHistory(),  没有回退记录
  // history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || 'vite-vue app';
  next();
});
