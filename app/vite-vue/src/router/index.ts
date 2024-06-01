import { createRouter, createWebHashHistory, RouteRecordRaw, createMemoryHistory, createWebHistory } from "vue-router"
import HelloWorld from "@/components/HelloWorld.vue"

const routes:RouteRecordRaw[] = [
    { path: '',name:'un-matched', component: HelloWorld },
    { path: '/hello-world',name:'hello-world', component: HelloWorld },
    // 发布订阅模式
    { path: '/event-bus', name:'event-bus', component: ()=>import('@/view/event-bus/index.vue')},
    // 观察者模式
    { path: '/event-bus', name:'event-bus', component: ()=>import('@/view/observer-mode/index.vue')},
]

export const router = createRouter({
    // history: createWebHistory(),
    // history: createMemoryHistory(),
    history: createWebHashHistory(),
    routes,
})