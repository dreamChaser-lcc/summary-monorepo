# Vue 响应式系统深度解析：原理与丢失响应式的原因

本文深入探讨 Vue 响应式系统的底层实现（Vue 2 与 Vue 3 的区别），并从原理层面解释为什么某些操作会导致响应式丢失。

---

## 一、 为什么会丢失响应式？(原理层解释)

### 1. Vue 2: `Object.defineProperty` 的局限性

Vue 2 的核心是利用 `Object.defineProperty` 将对象的属性转化为 getter/setter。

```javascript
// 模拟 Vue 2 的响应式
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      console.log(`读取 ${key}`);
      return val;
    },
    set(newVal) {
      console.log(`设置 ${key} = ${newVal}`);
      val = newVal;
      // updateView(); // 触发更新
    }
  });
}
```

#### 原因 A: 只能拦截“已有”属性
`Object.defineProperty` 必须在**初始化时**针对具体的 `key` 进行定义。
*   **丢失场景**：`this.obj.newProp = 1`。
*   **原因**：初始化时 `obj` 里没有 `newProp`，所以 Vue 没给它定义 setter。你后来加上去时，它只是一个普通的属性，修改它不会触发 setter 中的更新逻辑。

#### 原因 B: 数组索引性能问题
虽然 `defineProperty` 理论上可以拦截数组索引（如 `arr[0]`），但因为数组长度可能很大且经常变动，给每个索引都加拦截**性能开销太大**。
*   **丢失场景**：`this.arr[0] = 1`。
*   **原因**：Vue 出于性能考虑，**放弃了**对数组索引的拦截。它重写了数组的 7 个变异方法（push, pop 等）来实现响应式，所以只有调方法才有用。

---

### 2. Vue 3: `Proxy` 的局限性（解构丢失）

Vue 3 使用 `Proxy` 代理整个对象，能感知任何属性的增删。

#### 原因 C: 值传递 vs 引用传递 (解构丢失)

这是 JavaScript 语言本身的特性，与 Proxy 无关。

```javascript
const state = reactive({ count: 0 }); // state 是一个 Proxy 对象
let { count } = state;                // count 是一个普通数字 0 (基本类型)
```

*   **丢失场景**：解构 `reactive` 对象。
*   **原因**：
    1.  `state.count` 是响应式的，因为访问它会触发 Proxy 的 `get` 拦截。
    2.  当你解构 `let { count } = state` 时，相当于 `let count = state.count`。
    3.  此时 `count` 只是一个**普通的基本类型值**（0）。它跟 Proxy 没有任何联系了。
    4.  你修改 `count++`，只是修改了一个局部变量，Proxy 根本不知道。

---

## 二、 响应式系统实现原理 (Mini-Vue)

为了彻底理解，我们手写一个极简的 Vue 3 响应式系统。

### 1. 核心角色

1.  **Reactive**: 把普通对象变成 Proxy。
2.  **Effect (副作用)**: 当前正在执行的函数（比如组件渲染函数）。
3.  **Dep (依赖)**: 存储 `Target -> Key -> Effect` 的映射关系。

### 2. 代码实现

```javascript
// 全局变量，存储当前的 Effect
let activeEffect = null;

// 1. 依赖收集器 (Dep)
// targetMap: { target对象: { key: Set<Effect> } }
const targetMap = new WeakMap();

function track(target, key) {
  if (!activeEffect) return;
  
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  
  dep.add(activeEffect); // 把当前函数收集起来
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect()); // 执行所有收集到的副作用函数
  }
}

// 2. 响应式转换 (Reactive)
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      // 关键点：读取时收集依赖
      track(target, key);
      return res;
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver);
      // 关键点：修改时触发更新
      trigger(target, key);
      return res;
    }
  });
}

// 3. 副作用函数 (Effect)
// 类似于 Vue 的 watchEffect 或组件渲染
function effect(fn) {
  activeEffect = fn;
  fn(); // 立即执行一次，触发 get -> track
  activeEffect = null;
}
```

### 3. 运行流程演示

```javascript
const state = reactive({ count: 0 });

// 模拟组件渲染
effect(() => {
  console.log('渲染界面，Count:', state.count);
});

// 输出: 渲染界面，Count: 0
// (原因: effect 执行 -> 读取 state.count -> 触发 get -> track 收集了当前函数)

state.count++;
// 输出: 渲染界面，Count: 1
// (原因: 修改 state.count -> 触发 set -> trigger -> 重新执行刚才收集的函数)
```

## 三、 总结

| 特性 | Vue 2 (defineProperty) | Vue 3 (Proxy) |
| :--- | :--- | :--- |
| **新增属性** | ❌ 无法拦截 (需用 $set) | ✅ 可拦截 |
| **删除属性** | ❌ 无法拦截 (需用 $delete) | ✅ 可拦截 |
| **数组索引** | ❌ 性能原因放弃拦截 | ✅ 可拦截 |
| **Map/Set** | ❌ 不支持 | ✅ 支持 |
| **解构** | ❌ 丢失响应式 | ❌ 丢失响应式 (需用 toRefs) |
