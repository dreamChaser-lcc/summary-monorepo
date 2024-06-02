import { PiniaPlugin } from "pinia";

/**
 * 定义一个pinia插件，
 * 有多少个store就会执行这个方法几次
 * 有点类似于中间件
 * @param context 文档：https://pinia.vuejs.org/zh/core-concepts/plugins.html
 */
export const myPiniaPlugin:PiniaPlugin = (context)=>{
    const { pinia, app, options, store } = context;
    console.log("🚀 ~ pinia,app,options,store:", pinia,app,options,store)

    store.$subscribe(() => {
    // 响应 store 变化
    })
    store.$onAction(() => {
    // 响应 store actions
    })

    // 只是针对userInfo这个Store添加一个属性
    if(store.$id === 'userInfo'){
        return { commonData:'我是公共的状态' }
    }
    // 除了userInfo这个Store都添加属性
    return { allStoreCommonData:'我是公共的状态' }
}

/**
 * 定义一个插件来实现数据持久化
 * 社区插件 https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/why.html
 * @param param0 
 */
export function localStoragePlugin({store}) {
    console.log("🚀 ~ localStoragePlugin ~ store:", store)
    store.$subscribe((mutation) => {
        console.log("🚀 ~ store.$subscribe ~ mutation:", mutation)
        // localStorage.setItem('savedData', JSON.stringify(store.data));
    }); 
}