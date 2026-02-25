# Vue 自定义指令 (Custom Directives) 指南

自定义指令是 Vue 中用于封装**底层 DOM 操作**的机制。当你的需求涉及直接操作 DOM（如聚焦、滚动、事件监听）而非数据驱动时，指令是最佳选择。

## 1. 基础语法 (Vue 3)

Vue 3 的指令钩子函数与组件生命周期保持一致，更加直观。

### 1.1 钩子函数
*   `created(el, binding, vnode)`
*   `beforeMount(el, binding, vnode)`
*   `mounted(el, binding, vnode)` ✅ **最常用**
*   `beforeUpdate(el, binding, vnode, prevVnode)`
*   `updated(el, binding, vnode, prevVnode)`
*   `beforeUnmount(el, binding, vnode)`
*   `unmounted(el, binding, vnode)` ✅ **用于清理**

### 1.2 参数详解 (`binding` 对象)
*   `value`: 传递给指令的值。例如 `v-my-directive="1 + 1"` 中，值是 `2`。
*   `oldValue`: 之前的值（仅在 update 钩子中可用）。
*   `arg`: 参数。例如 `v-my-directive:foo` 中，参数是 `"foo"`。
*   `modifiers`: 修饰符。例如 `v-my-directive.foo.bar` 中，修饰符是 `{ foo: true, bar: true }`。

---

## 2. 实战案例

### 案例 A: `v-focus` (自动聚焦)
最简单的指令，页面加载时自动聚焦输入框。

```javascript
const vFocus = {
  mounted: (el) => el.focus()
}

// 使用
// <input v-focus />
```

### 案例 B: `v-click-outside` (点击外部关闭)
常用于弹窗、下拉菜单。

```javascript
const vClickOutside = {
  mounted(el, binding) {
    // 定义处理函数
    el._clickOutsideHandler = (event) => {
      // 检查点击目标是否在元素外部
      if (!(el === event.target || el.contains(event.target))) {
        // 调用传入的回调函数
        binding.value(event);
      }
    };
    // 注册全局点击事件
    document.addEventListener('click', el._clickOutsideHandler);
  },
  unmounted(el) {
    // 销毁时移除监听，防止内存泄漏
    document.removeEventListener('click', el._clickOutsideHandler);
  }
};

// 使用
// <div v-click-outside="closeModal">...</div>
```

### 案例 C: `v-lazy` (图片懒加载)
利用 `IntersectionObserver` 实现图片进入视口才加载。

```javascript
const vLazy = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 进入视口，开始加载图片
          el.src = binding.value;
          // 停止观察
          observer.unobserve(el);
        }
      });
    });
    observer.observe(el);
  }
};

// 使用
// <img v-lazy="'https://example.com/image.jpg'" />
```

### 案例 D: `v-permission` (权限控制)
根据用户权限控制按钮显示/隐藏。

```javascript
const vPermission = {
  mounted(el, binding) {
    const { value: requiredRole } = binding;
    const userRole = localStorage.getItem('role'); // 假设从 store 获取

    if (userRole !== requiredRole) {
      // 如果权限不符，移除元素
      el.parentNode && el.parentNode.removeChild(el);
    }
  }
};

// 使用
// <button v-permission="'admin'">删除用户</button>
```

---

## 3. 最佳实践

1.  **不要在指令中修改数据**：指令应该只负责 DOM 操作。如果需要修改数据，应该通过触发事件让组件自己去改。
2.  **清理副作用**：如果在 `mounted` 中添加了事件监听或定时器，务必在 `unmounted` 中清除。
3.  **命名规范**：指令名通常是动词或名词，如 `v-focus`, `v-draggable`。
