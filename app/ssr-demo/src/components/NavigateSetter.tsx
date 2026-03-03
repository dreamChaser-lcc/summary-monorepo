import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '../utils/history';

/**
 * 这是一个不可见的工具组件
 * 它的唯一作用就是获取 useNavigate 的引用，并把它暴露给全局工具函数
 * 必须放在 <BrowserRouter> 或 <StaticRouter> 内部
 */
const NavigateSetter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 组件挂载时，设置全局 navigate
    setNavigate(navigate);
  }, [navigate]);

  return null; // 不渲染任何 UI
};

export default NavigateSetter;
