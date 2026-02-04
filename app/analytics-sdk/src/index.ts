
import { TrackerCore } from './core/tracker';
import { TrackerConfig } from './types';
import { getDomPath } from './utils/dom';

export class AnalyticsSDK {
  private tracker: TrackerCore;
  private config: TrackerConfig;
  private observer: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.tracker = new TrackerCore(config);

    if (config.autoTrack !== false) {
      this.initAutoPV();
    }
    // 除非显式禁用，否则默认初始化声明式埋点
    this.initDeclarativeTracking();
    
    if (config.autoClick) {
      this.initAutoClick();
    }
  }

  /**
   * 初始化自动 PV (页面访问) 追踪
   * 支持 SPA (History/Hash) 和 MPA
   */
  private initAutoPV() {
    // 1. 初始加载
    this.tracker.trackPV();

    // 2. 拦截 History API (pushState, replaceState)
    const originalPush = history.pushState;
    history.pushState = (...args) => {
      const result = originalPush.apply(history, args);
      this.tracker.trackPV();
      return result;
    };

    const originalReplace = history.replaceState;
    history.replaceState = (...args) => {
      const result = originalReplace.apply(history, args);
      this.tracker.trackPV();
      return result;
    };

    // 3. 监听 PopState (浏览器后退/前进)
    window.addEventListener('popstate', () => {
      this.tracker.trackPV();
    });

    // 4. 监听 HashChange (Hash 路由变化)
    window.addEventListener('hashchange', () => {
      this.tracker.trackPV();
    });
  }

  /**
   * 初始化声明式埋点 (.on-click, .on-visible)
   * 通过监听类名自动触发上报，支持 MutationObserver 动态元素
   */
  private initDeclarativeTracking() {
    // 1. 点击事件监听 (事件委托)
    document.addEventListener(
      'click',
      (event) => {
        let target = event.target as HTMLElement;
        // 向上冒泡查找包含 .on-click 的元素
        while (target && target !== document.body) {
          if (target.classList && target.classList.contains('on-click')) {
            this.handleDeclarativeEvent(target, 'click');
            break; 
          }
          target = target.parentElement as HTMLElement;
        }
      },
      true
    );

    // 2. 曝光监测 (IntersectionObserver)
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              this.handleDeclarativeEvent(target, 'visible');
              // 首次曝光后取消监听，避免重复上报
              this.observer?.unobserve(target);
            }
          });
        },
        { threshold: 0.5 } // 当元素 50% 可见时触发
      );

      // 初始扫描页面上的元素
      this.observeVisibleElements();

      // 3. MutationObserver 监听动态插入的内容
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                // 检查节点自身
                if (node.classList.contains('on-visible')) {
                  this.observer?.observe(node);
                }
                // 检查子节点
                node.querySelectorAll('.on-visible').forEach((el) => {
                  this.observer?.observe(el);
                });
              }
            });
          }
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 扫描并观察页面上所有带有 .on-visible 的元素
   */
  private observeVisibleElements() {
    document.querySelectorAll('.on-visible').forEach((el) => {
      this.observer?.observe(el);
    });
  }

  /**
   * 处理声明式事件的上报逻辑
   * 解析 data-args 属性并发送事件
   */
  private handleDeclarativeEvent(target: HTMLElement, type: 'click' | 'visible') {
    // 从 data-args 属性获取自定义参数
    // 格式: data-args='{"id": 123, "name": "banner"}'
    let args = {};
    const argsStr = target.getAttribute('data-args');
    if (argsStr) {
      try {
        args = JSON.parse(argsStr);
      } catch (e) {
        console.warn('[AnalyticsSDK] Invalid data-args JSON:', argsStr);
      }
    }

    const eventName = type === 'click' ? 'WebClick_Declarative' : 'WebShow_Declarative';
    
    this.tracker.trackEvent(eventName, {
      ...args,
      $element_id: target.id,
      $element_class_name: target.className,
      $trigger_type: type
    });
  }

  /**
   * 初始化全自动点击埋点 (全埋点)
   * 监听所有点击事件并生成选择器路径
   */
  private initAutoClick() {
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        // 生成 DOM 路径
        const selector = getDomPath(target);
        
        // 提取元素内容
        const content = target.innerText 
          ? target.innerText.slice(0, 50) 
          : (target as HTMLInputElement).value || '';

        this.tracker.trackEvent('$WebClick', {
          $element_selector: selector,
          $element_content: content,
          $element_id: target.id,
          $element_class_name: target.className,
          $element_tag_name: target.tagName.toLowerCase(),
          $page_x: (event as MouseEvent).pageX,
          $page_y: (event as MouseEvent).pageY,
        });
      },
      true // 使用捕获阶段
    );
  }

  /**
   * 手动上报自定义事件
   * @param eventName 事件名称
   * @param params 事件参数
   */
  public track(eventName: string, params?: Record<string, any>) {
    this.tracker.trackEvent(eventName, params);
  }
}

// 导出供模块化使用
export default AnalyticsSDK;
// 挂载到 window 供 CDN 方式使用
(window as any).AnalyticsSDK = AnalyticsSDK;
