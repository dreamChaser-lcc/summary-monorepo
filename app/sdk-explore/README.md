# sdk-explore

- 探索打包输出的各种模块化的区别对比
- sdk打包输出格式规范
- 学习的sdk库地址[radash库](https://www.npmjs.com/package/radash)

## 构建选项配置

[BUILD_OPTIONS.md](./BUILD_OPTIONS.md)

## 各个模块化进行对比

### 1. CommonJS (CJS)

特点 ：

- Node.js 的默认模块系统
- 同步加载
- 运行时加载

语法 ：

```javascript
// 导出
module.exports = { chunk, map };
// 或
exports.chunk = chunk;
exports.map = map;

// 导入
const radash = require('radash');
const { chunk, map } = require('radash');
```

优缺点 ：

- ✅ 简单易用，Node.js 原生支持
- ✅ 可以动态导入
- ❌ 同步加载，不适合浏览器
- ❌ 无法静态分析，不支持 tree-shaking

### 2. ES Modules (ESM)

特点 ：

- JavaScript 官方标准
- 静态结构，编译时确定依赖
- 异步加载
- 支持 tree-shaking

语法 ：

```javascript
// 导出
export { chunk, map };
export default radash;

// 导入
import radash from 'radash';
import { chunk, map } from 'radash';
```

优缺点 ：

- ✅ 官方标准，现代浏览器原生支持
- ✅ 静态分析，支持 tree-shaking
- ✅ 异步加载，适合浏览器
- ❌ 不能动态导入（除非使用 import()）

### 3. AMD (Asynchronous Module Definition)

特点 ：

- 异步模块定义
- 主要用于浏览器
- RequireJS 是主要实现

语法 ：

```javascript
// 定义模块
define(['dependency1', 'dependency2'], function(dep1, dep2) {
  return {
    chunk: function() { /* ... */ },
    map: function() { /* ... */ }
  };
});

// 使用模块
require(['radash'], function(radash) {
  radash.chunk([1,2,3,4], 2);
});
```

优缺点 ：

- ✅ 异步加载，适合浏览器
- ✅ 依赖管理清晰
- ❌ 语法复杂
- ❌ 需要额外的加载器（RequireJS）

### 4. UMD (Universal Module Definition)

特点 ：

- 通用模块定义
- 兼容多种模块系统（commonjs、AMD、全局变量）
- 运行时检测环境

语法 ：

```javascript
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else {
    // 全局变量
    global.radash = factory();
  }
})(this, function () {
  return {
    chunk: function() { /* ... */ },
    map: function() { /* ... */ }
  };
});
```

优缺点 ：

- ✅ 通用兼容性
- ✅ 一个文件适用多种环境
- ❌ 文件体积较大
- ❌ 运行时检测，性能略差

### 5. IIFE (Immediately Invoked Function Expression)

特点 ：

- 立即执行函数表达式
- 创建全局变量
- 最简单的模块化方式
语法 ：

```javascript
(function(global) {
  global.radash = {
    chunk: function() { /* ... */ },
    map: function() { /* ... */ }
  };
})(window);

// 使用
radash.chunk([1,2,3,4], 2);
```

优缺点 ：

- ✅ 简单直接
- ✅ 兼容性最好
- ✅ 文件体积最小
- ❌ 污染全局命名空间
- ❌ 无依赖管理

### 6. SystemJS

特点 ：

- 动态模块加载器
- 支持多种模块格式
- 运行时模块系统

语法 ：

```javascript
// 导入
System.import('radash').then(function(radash) {
  radash.chunk([1,2,3,4], 2);
});
```

## 模块化系统对比表

| 特性 | CommonJS | ES Modules | AMD | UMD | IIFE |
|------|----------|------------|-----|-----|------|
| **运行环境** | Node.js | 现代浏览器/Node.js | 浏览器 | 通用 | 浏览器 |
| **加载方式** | 同步 | 异步 | 异步 | 取决于环境 | 立即执行 |
| **静态分析** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Tree-shaking** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **动态导入** | ✅ | ✅ (import()) | ✅ | ✅ | ❌ |
| **文件体积** | 中等 | 小 | 大 | 大 | 最小 |
| **兼容性** | Node.js | 现代环境 | 需要加载器 | 最好 | 最好 |
| **标准化** | Node.js 标准 | ECMAScript 标准 | 社区标准 | 通用模式 | 传统模式 |
| **性能** | 中等 | 高 | 中等 | 中等 | 高 |
| **开发体验** | 简单 | 现代 | 复杂 | 通用 | 简单 |

## package.json 的模块解析顺序✅

 现代打包工具的解析顺序：

 1. 首先查看 exports.import
 2. 如果没有，查看 module 字段
 3. 最后查看 main 字段

Node.js 的解析顺序：

1. 首先查看 exports.require
2. 如果没有，查看 main 字段
