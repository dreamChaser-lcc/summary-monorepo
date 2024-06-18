import { createRouter, createWebHashHistory, RouteRecordRaw, createMemoryHistory, createWebHistory } from "vue-router"
import HelloWorld from "@/components/HelloWorld.vue"

export const routes:RouteRecordRaw[] = [
    { path: '',name:'un-matched', component: ()=>import('@/view/menu/index.vue') },
    { path: '/hello-world',name:'hello-world', component: HelloWorld },
    // 发布订阅模式
    { path: '/event-bus', name:'event-bus', component: ()=>import('@/view/event-bus/index.vue'), meta:{ title: '发布订阅模式' }},
    // 观察者模式
    { path: '/observer-mode', name:'observer-mode', component: ()=>import('@/view/observer-mode/index.vue'), meta:{ title: '观察者模式' }},
    // pinia和vuex状态管理使用
    { path: '/store-use', name:'store-use', component: ()=>import('@/view/store-use/index.vue'), meta:{ title: 'pinia和vuex状态管理' }},
    { 
        path: '/tailwind-use',
        name:'tailwind-use', 
        component: ()=>import('@/view/tailwind-use/index.vue'), 
        meta:{ 
            title: 'tailwind引入'
        }
    },
    // 分片上传
    { path: '/split-upload', name:'split-upload', component: ()=>import('@/view/split-upload/index.vue'), meta:{ title: '分片上传' }},
]

export const router = createRouter({
    // history: createWebHistory(),     刷新后需要重定向到入口路径
    // history: createMemoryHistory(),  没有回退记录
    history: createWebHashHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title as string || 'vite-vue app';
    next();
});