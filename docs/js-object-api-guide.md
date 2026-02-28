# JavaScript 对象核心 API 与遍历机制全解

本文深入解析 `Object.create`、`Object.is` 等高频考点方法，梳理常见对象 API，并总结 5 种对象遍历方式的区别。

---

## 一、核心 API 深度解析

### 1. `Object.create(proto, [propertiesObject])`

*   **作用**：创建一个新对象，使用现有的对象来提供新创建的对象的 `__proto__`（原型）。
*   **参数**：
    *   `proto`：新创建对象的原型对象。可以是 `null`。
    *   `propertiesObject` (可选)：属性描述符对象（类似 `Object.defineProperties` 的第二个参数）。

*   **常见用法**：
    1.  **实现继承**：`Sub.prototype = Object.create(Super.prototype)`。
    2.  **创建纯净对象**：`Object.create(null)` 创建的对象没有原型链（无 `toString`、`hasOwnProperty` 等方法），常用于当作字典（Map）使用。

*   **高频考点**：
    *   `Object.create(null)` vs `{}`：前者原型为 `null`，后者原型为 `Object.prototype`。
    *   **手写 Object.create**：
        ```javascript
        function create(proto) {
          function F() {}
          F.prototype = proto;
          return new F();
        }
        ```

### 2. `Object.is(value1, value2)`

*   **作用**：判断两个值是否为**同一个值**。
*   **与 `===` (严格相等) 的区别**：
    1.  **`NaN` 处理**：`Object.is(NaN, NaN)` 为 `true`，而 `NaN === NaN` 为 `false`。
    2.  **`+0` 和 `-0` 处理**：`Object.is(+0, -0)` 为 `false`，而 `+0 === -0` 为 `true`。
    *   其他情况与 `===` 完全一致。

*   **Polyfill 实现 (面试考点)**：
    ```javascript
    if (!Object.is) {
      Object.is = function(x, y) {
        if (x === y) {
          // 处理 +0 和 -0
          // 1/+0 = Infinity, 1/-0 = -Infinity
          return x !== 0 || 1 / x === 1 / y;
        } else {
          // 处理 NaN
          return x !== x && y !== y;
        }
      };
    }
    ```

---

## 二、常见对象方法与考点

| 方法 | 作用 | 考点 / 注意事项 |
| :--- | :--- | :--- |
| **`Object.assign(target, ...sources)`** | 浅拷贝源对象的可枚举属性到目标对象。 | **浅拷贝**！嵌套对象引用不变。若源有 getter，会触发 getter 并拷贝**返回值**。 |
| **`Object.keys(obj)`** | 返回对象自身可枚举属性名的数组。 | 不包含原型链属性，不包含 Symbol 属性。 |
| **`Object.values(obj)`** | 返回对象自身可枚举属性值的数组。 | 顺序同 `for...in` 循环（除 Symbol）。 |
| **`Object.entries(obj)`** | 返回 `[key, value]` 键值对数组。 | 常配合 `new Map(Object.entries(obj))` 转 Map。 |
| **`Object.fromEntries(iterable)`** | 将键值对列表转换为对象（`entries` 的逆操作）。 | 适合将 Map 转对象，或过滤对象属性。 |
| **`Object.defineProperty(obj, prop, descriptor)`** | 定义或修改属性（Vue 2 核心）。 | 默认 `enumerable`, `writable`, `configurable` 均为 `false`。 |
| **`Object.freeze(obj)`** | **冻结**对象：不能增删改属性。 | **浅冻结**！嵌套对象仍可修改。返回原对象。 |
| **`Object.seal(obj)`** | **密封**对象：不能增删属性，但现有属性可修改。 | `configurable: false`。 |
| **`Object.preventExtensions(obj)`** | **禁止扩展**：不能添加新属性。 | 现有属性可删可改。 |
| **`Object.getPrototypeOf(obj)`** | 获取对象的原型（`__proto__`）。 | 推荐替代非标准的 `__proto__`。 |

---

## 三、对象遍历方式全总结

假设有以下对象结构：

```javascript
const parent = { p: 'parent' };
const obj = Object.create(parent); // 继承 parent
obj.a = 1;
obj.b = 2;
Object.defineProperty(obj, 'c', { value: 3, enumerable: false }); // 不可枚举
const sym = Symbol('sym');
obj[sym] = 4; // Symbol 属性
```

### 1. `for...in`
*   **遍历范围**：自身 + **原型链**上的**可枚举**属性。
*   **不包含**：Symbol 属性。
*   **注意**：通常配合 `obj.hasOwnProperty(key)` 使用，过滤掉原型链属性。
*   **结果**：`a`, `b`, `p`

### 2. `Object.keys(obj)`
*   **遍历范围**：**自身**的**可枚举**属性。
*   **不包含**：原型链属性、Symbol 属性、不可枚举属性。
*   **结果**：`['a', 'b']`

### 3. `Object.getOwnPropertyNames(obj)`
*   **遍历范围**：**自身**的所有属性（包括**不可枚举**）。
*   **不包含**：原型链属性、Symbol 属性。
*   **结果**：`['a', 'b', 'c']` (包含了不可枚举的 c)

### 4. `Object.getOwnPropertySymbols(obj)`
*   **遍历范围**：**自身**的所有 **Symbol** 属性。
*   **结果**：`[Symbol(sym)]`

### 5. `Reflect.ownKeys(obj)` (最全)
*   **遍历范围**：**自身**的所有属性（包括**不可枚举** + **Symbol**）。
*   **等价于**：`Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))`。
*   **结果**：`['a', 'b', 'c', Symbol(sym)]`

### 总结对比表

| 方式 | 自身属性 | 原型链属性 | 不可枚举属性 | Symbol 属性 |
| :--- | :---: | :---: | :---: | :---: |
| **for...in** | ✅ | ✅ | ❌ | ❌ |
| **Object.keys** | ✅ | ❌ | ❌ | ❌ |
| **Object.getOwnPropertyNames** | ✅ | ❌ | ✅ | ❌ |
| **Object.getOwnPropertySymbols** | ❌ | ❌ | ❌ | ✅ (仅 Symbol) |
| **Reflect.ownKeys** | ✅ | ❌ | ✅ | ✅ |
