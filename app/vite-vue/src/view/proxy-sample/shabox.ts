export const a = 1;

function createFakeWindow(globalContext: Window) {
  // map always has the fastest performance in has check scenario
  // see https://jsperf.com/array-indexof-vs-set-has/23
  const propertiesWithGetter = new Map<PropertyKey, boolean>();
  const fakeWindow = {} as any;
  Object.getOwnPropertyNames(globalContext)
    .filter((p) => {
      const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
      return !descriptor?.configurable;
    })
    .forEach((p) => {
      const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
      if (descriptor) {
        const hasGetter = Object.prototype.hasOwnProperty.call(descriptor, 'get');

        if (p === 'top' || p === 'parent' || p === 'self' || p === 'window') {
          descriptor.configurable = true;
          if (!hasGetter) {
            descriptor.writable = true;
          }
        }

        if (hasGetter) propertiesWithGetter.set(p, true);

        // freeze the descriptor to avoid being modified by zone.js
        // see https://github.com/angular/zone.js/blob/a5fe09b0fac27ac5df1fa746042f96f05ccb6a00/lib/browser/define-property.ts#L71
        Object.defineProperty(fakeWindow, p, Object.freeze(descriptor));
      }
    });

  return {
    fakeWindow,
    propertiesWithGetter,
  };
}

type FakeWindow = Window & Record<PropertyKey, any>;
/**
 * 基于 Proxy 实现的沙箱
 */
export default class ProxySandbox {
  /** window 值变更记录 */
  private updatedValueSet = new Set<PropertyKey>();

  name: string;

  type: any;

  proxy: WindowProxy;

  globalContext: typeof window;

  sandboxRunning = true;

  latestSetProp: PropertyKey | null = null;

  // private registerRunningApp(name: string, proxy: Window) {
  //   if (this.sandboxRunning) {
  //     const currentRunningApp = getCurrentRunningApp();
  //     if (!currentRunningApp || currentRunningApp.name !== name) {
  //       setCurrentRunningApp({ name, window: proxy });
  //     }
  //     // FIXME if you have any other good ideas
  //     // remove the mark in next tick, thus we can identify whether it in micro app or not
  //     // this approach is just a workaround, it could not cover all complex cases, such as the micro app runs in the same task context with master in some case
  //     nextTask(() => {
  //       setCurrentRunningApp(null);
  //     });
  //   }
  // }

  // active() {
  //   if (!this.sandboxRunning) activeSandboxCount++;
  //   this.sandboxRunning = true;
  // }

  // inactive() {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.info(`[qiankun:sandbox] ${this.name} modified global properties restore...`, [
  //       ...this.updatedValueSet.keys(),
  //     ]);
  //   }

  //   if (--activeSandboxCount === 0) {
  //     variableWhiteList.forEach((p) => {
  //       if (this.proxy.hasOwnProperty(p)) {
  //         // @ts-ignore
  //         delete this.globalContext[p];
  //       }
  //     });
  //   }

  //   this.sandboxRunning = false;
  // }

  constructor(name: string, globalContext = window) {
    this.name = name;
    this.globalContext = globalContext;
    // this.type = SandBoxType.Proxy;
    const { updatedValueSet } = this;

    const { fakeWindow, propertiesWithGetter } = createFakeWindow(globalContext);

    const descriptorTargetMap = new Map<PropertyKey, any>();
    const hasOwnProperty = (key: PropertyKey) =>
      fakeWindow.hasOwnProperty(key) || globalContext.hasOwnProperty(key);

    const proxy = new Proxy(fakeWindow, {
      set: (target: FakeWindow, p: PropertyKey, value: any): boolean => {
        console.log('ininSet');
        if (true || this.sandboxRunning) {
          // this.registerRunningApp(name, proxy);
          // We must kept its description while the property existed in globalContext before
          if (!target.hasOwnProperty(p) && globalContext.hasOwnProperty(p)) {
            const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
            const { writable, configurable, enumerable } = descriptor!;
            if (writable) {
              Object.defineProperty(target, p, {
                configurable,
                enumerable,
                writable,
                value,
              });
            }
          } else {
            // @ts-ignore
            target[p] = value;
          }

          // if (variableWhiteList.indexOf(p) !== -1) {
          //   // @ts-ignore
          //   globalContext[p] = value;
          // }

          updatedValueSet.add(p);

          this.latestSetProp = p;

          return true;
        }

        // if (process.env.NODE_ENV === 'development') {
        //   console.warn(`[qiankun] Set window.${p.toString()} while sandbox destroyed or inactive in ${name}!`);
        // }

        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true;
      },

      get: (target: FakeWindow, p: PropertyKey): any => {
        // this.registerRunningApp(name, proxy);

        // if (p === Symbol.unscopables) return unscopables;
        // avoid who using window.window or window.self to escape the sandbox environment to touch the really window
        // see https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js#L13
        if (p === 'window' || p === 'self') {
          return proxy;
        }

        // hijack globalWindow accessing with globalThis keyword
        if (p === 'globalThis') {
          return proxy;
        }

        if (
          p === 'top' ||
          p === 'parent'
          // (process.env.NODE_ENV === 'test' && (p === 'mockTop' || p === 'mockSafariTop'))
        ) {
          // if your master app in an iframe context, allow these props escape the sandbox
          if (globalContext === globalContext.parent) {
            return proxy;
          }
          return (globalContext as any)[p];
        }

        // proxy.hasOwnProperty would invoke getter firstly, then its value represented as globalContext.hasOwnProperty
        if (p === 'hasOwnProperty') {
          return hasOwnProperty;
        }

        if (p === 'document') {
          return document;
        }

        if (p === 'eval') {
          return eval;
        }

        const value = propertiesWithGetter.has(p)
          ? (globalContext as any)[p]
          : p in target
            ? (target as any)[p]
            : (globalContext as any)[p];

        console.log('ininGet方法了');
        // const boundTarget = useNativeWindowForBindingsProps.get(p) ? nativeGlobal : globalContext;
        return 'inin';
      },

      getOwnPropertyDescriptor(
        target: FakeWindow,
        p: string | number | symbol,
      ): PropertyDescriptor | undefined {
        if (target.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(target, p);
          descriptorTargetMap.set(p, 'target');
          return descriptor;
        }

        if (globalContext.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
          descriptorTargetMap.set(p, 'globalContext');
          // A property cannot be reported as non-configurable, if it does not exists as an own property of the target object
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }

        return undefined;
      },

      defineProperty(target: Window, p: PropertyKey, attributes: PropertyDescriptor): boolean {
        const from = descriptorTargetMap.get(p);
        switch (from) {
          case 'globalContext':
            return Reflect.defineProperty(globalContext, p, attributes);
          default:
            return Reflect.defineProperty(target, p, attributes);
        }
      },

      // deleteProperty: (target: FakeWindow, p: string | number | symbol): boolean => {
      //   this.registerRunningApp(name, proxy);
      //   if (target.hasOwnProperty(p)) {
      //     // @ts-ignore
      //     delete target[p];
      //     updatedValueSet.delete(p);

      //     return true;
      //   }

      //   return true;
      // },

      // makes sure `window instanceof Window` returns truthy in micro app
      getPrototypeOf() {
        return Reflect.getPrototypeOf(globalContext);
      },
    });

    this.proxy = proxy;

    // activeSandboxCount++;
  }
}
