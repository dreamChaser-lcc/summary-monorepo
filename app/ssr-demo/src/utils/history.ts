// src/utils/history.ts
import { NavigateFunction } from 'react-router-dom';

let navigate: NavigateFunction | null = null;

/**
 * 设置全局的 navigate 函数
 * 必须在 Router 组件内部被调用一次
 */
export const setNavigate = (nav: NavigateFunction) => {
  navigate = nav;
};

/**
 * 在组件外部进行路由跳转
 * @param to 目标路径
 * @param options 导航选项
 */
export const historyPush = (to: string, options?: { replace?: boolean; state?: any }) => {
  if (navigate) {
    navigate(to, options);
  } else {
    console.warn('Navigate function is not initialized yet!');
    // 降级方案：如果没有初始化，使用原生跳转
    // 注意：这会导致页面刷新
    window.location.href = to;
  }
};

export const historyReplace = (to: string, state?: any) => {
  if (navigate) {
    navigate(to, { replace: true, state });
  } else {
    window.location.replace(to);
  }
};
