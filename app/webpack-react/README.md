# webpack-react 
使用webpack5从零搭建react+ts项目

## 主旨
- 探究并熟悉webpack5 构建工具
- 熟悉ts构建配置
- 体验monorepo管理项目,并且引入monorepo中的其他公共方法库
- 探究rem和vw经典移动端适配方案

## 核心demo
- rem 适配方案页面
- vw 适配方案页面
- 引用monorepo中的公共方法库

## 启动项目
1. 在根目录下安装依赖
```bash
pnpm install --filter webpack-react
```
2. 启动项目
```bash
pnpm run --filter webpack-react dev 
# or 
pnpm run --filter webpack-react build
# or
pnpm run --filter webpack-react build:serve
```

## webpack5搭建react项目

### 安装webpack相关依赖
```bash
 pnpm add webpack webpack-cli webpack-dev-server --filter webpack-react
```

### 安装loader依赖
处理ts的ts-loader, 兼容es6语法转换的babel-loader, 更多兼容语法的@babel/core (替代了旧版本的polyfill垫片，对promise,generator,等语法转换成能兼容更低版本的代码)
```bash
pnpm add html-webpack-plugin ts-loader @babel/core babel-loader --filter webpack-react
```

### postcss-loader 

对样式文件进行兼容处理,比如浏览器前缀,一键转换px2rem

```bash
pnpm install postcss-preset-env postcss-loader postcss --filter webpack-react
```
postcss-preset-env 集成了autoprefixer,可以自动添加浏览器兼容前缀,需要配合browserslist配置,可以在package.json中配置browserslist,或者创建.browserslistrc文件,`另外,babel插件读取的兼容浏览器版本也是读的这些配置(应该可以独立配置,暂时未查找)`
```json
// package.json,以下是且的交集关系
{
  "browserslist": [
    "> 1% in CN", // 需要兼容中国内使用浏览器大于1%的版本,即支持99%的版本
    "android >= 4.4", // 并且需要兼容android4.4以上版本
    "ios >= 8",   // 需要兼容ios8以上版本
    "not ie <= 11", // 不需要兼容ie11以下版本
    "firefox >= 15",  // 需要兼容firefox15以上版本
  ]
}
```
```js
// .browserslistrc文件
> 1% in CN
android >= 4.4
ios >= 8
not ie <= 11
firefox >= 15
```
#### 如何查看兼容浏览器的列表?
在终端项目根目录下输入以下命令会打印到控制台,显示出语法兼容的浏览器版本
```bash
npm install -g browserslist
# and
npx browserslist
```
文档:[browserslist](https://github.com/browserslist/browserslist)


### 安装 plugin 依赖
慢点再总结

### 安装typescript
```bash
pnpm add -w typescript 
# and 初始化配置文件tsconfig.json
npx tsc --init
```

### 安装React
```bash
pnpm add react react-dom react-router-dom @types/react @types/react-dom --filter webpack-react
```

### 运行工作空间(workspace)中的单个项目脚本
```bash
pnpm run -C app/webpack-react dev
# or 
pnpm run --filter webpack-react dev
```

## webpack sourceMap详解
相关文章：https://www.cnblogs.com/yaopengfei/p/17192040.html

webpack配置：https://webpack.docschina.org/configuration/devtool/

正则组合公式：[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map

cheap: 错误信息，只会映射到行不会映射到列，比较低开销，较高效

module: sourceMap是未编译的代码，即react或vue代码，否则是已经编译后的js文件，较慢

避免在生产中使用 inline-*** 和 eval-***，因为它们会增加 bundle 体积大小，并降低整体性能。

结论：
开发环境： cheap-source-map 或者 cheap-module-source-map 
生产环境： source-map 或者 false

```js
// webpack.config.js
{
  devtool: 'source-map'
}
```
### webpack 热模块更新

```js
// webpack.config.js
{
  devServer: {
    hot: true, // webpack5+默认内置，其他版本需要HotModuleReplacementPlugin
  },
}
```
在React应用中可以使用react-hot-loader,实现组件级别的热模块更新，webpack仅支持模块级别的更新，不够精细

### webpack externals 将一些第三方包取消打包，通过cdn引入
可以添加externals之后手动引入cdn脚本,或者借助html-webpack-externals-plugin插件,或者借助html-webpack-plugin插件（以下流程）
1. webpack externals 配置
```js
// webpack.config.js

// 原本返回的配置,改写成下面的写法
module.exports = merge(baseConfig, prodConfig);

// 以下代码两个作用
// 1. externals配置到webpack config中
// 2. 将externalsCdns变量添加到html-webpack-plugin中的options中
// 为什么这么处理，在template配置的index.html中可以读取htmlWebpackPlugin.options.externalsCdns
// 然后通过handlebars模板语法遍历引入cdn资源
const handleExternalConfig = ()=>{
  const config = merge(baseConfig, prodConfig);

  const externalsCdns = [
    "https://cdn.bootcdn.net/ajax/libs/react/18.2.0/umd/react.production.min.js",
    "https://cdn.bootcdn.net/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  ]
  // 因为html-webpack-plugin是配置在数组第一个,所以plugins[0]
  config.plugins[0].options = Object.assign({}, config.plugins[0].options, { externalsCdns });
  const externals =  {
    'react': 'React',
    "react-dom": 'ReactDOM',
  };
  config.externals = Object.assign({},config.externals, externals);
  return config;
};

module.exports = handleExternalConfig();
```

2. 然后在html-webpack-plugin,template选项配置的中html文件读取externalsCdns变量，然后遍历引入cdn资源
```html
<!-- 读取注入htmlWebpackPlugin中的externalsCdns变量，并添加script脚本(使用defer,一定要比主包先引入，不然会找不到变量，因为主包也用了defer) -->
<% for (var i in htmlWebpackPlugin.options.externalsCdns && htmlWebpackPlugin.options.externalsCdns) { %>
    <script defer="defer" type="text/javascript" src="<%= htmlWebpackPlugin.options.externalsCdns[i] %>"></script>
<% } %>
```

## 如何启动本地打包文件，并测试部署效果
1. 安装serve
```bash
# 全局安装serve
npm install -g serve
# or pnpm 安装到全局（需要pnpm setup 指定环境变量）
pnpm add -g serve
# or pnpm安装到工作目录上
pnpm add -w serve 
```
2. 启动本地服务
```bash 
# packages/webpack-react/dist为打包后的资源路径
npx serve app/webpack-react/dist
# or 执行打包并启动测试服务
pnpm run --filter webpack-react build:serve
```

## 移动端适配方案
主要有三大类，
- 使用相对单位的方式等比缩放的缩放还原设计稿（rem,vw）
- 媒体查询适配，预设多中屏幕尺寸的样式（维护较难，成本大）
- flex、栅格布局方式，等自适应方式（容易导致样式和设计稿存在差异）

### 1.等比缩放rem方案
原理：rem是相对于html中font-size的单位，如html中的font-size默认是16px,那么1rem = 16px;
#### 如何适配?
经典库flexible, 源码地址：https://cdn.jsdelivr.net/npm/lib-flexible@0.3.2/flexible.js
主要做的事情：根据屏幕宽度(会受到屏幕缩放的营销)，计算出rem值，设置给html的font-size属性
```js
// flexible 源码改变html fontSize
function refreshRem(){
  var width = docEl.getBoundingClientRect().width;
  if (width / dpr > 540) {
      width = 540 * dpr;
  }
  var rem = width / 10;
  docEl.style.fontSize = rem + 'px';
  flexible.rem = win.rem = rem;
}
/**
 * 上面的源码中，docEl.getBoundingClientRect().width表示的是源码宽度,会受到屏幕缩放(viewport meta标签)的影响
 * <meta name="viewport" content="initial-scale=0.5,maximum-scale=0.5,minimum-scale=0.5,user-scalable=no">
 * 上面标签添加之后 docEl.getBoundingClientRect().width会比没有添加*2，相关知识要查看viewport的文档
 */
if (!dpr && !scale) {
    var isAndroid = win.navigator.appVersion.match(/android/gi);
    var isIPhone = win.navigator.appVersion.match(/iphone/gi);
    var devicePixelRatio = win.devicePixelRatio;
    if (isIPhone) {
        // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
        if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
            dpr = 3;
        } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
            dpr = 2;
        } else {
            dpr = 1;
        }
    } else {
        // 其他设备下，仍旧使用1倍的方案
        dpr = 1;
    }
    scale = 1 / dpr;
}
var metaEl = doc.querySelector('meta[name="viewport"]');
if (!metaEl) {
    metaEl = doc.createElement('meta');
    metaEl.setAttribute('name', 'viewport');
    metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
    if (docEl.firstElementChild) {
        docEl.firstElementChild.appendChild(metaEl);
    } else {
        var wrap = doc.createElement('div');
        wrap.appendChild(metaEl);
        doc.write(wrap.innerHTML);
    }
}
```
#### 如何实际
1. html 文件添加脚本 `<script src="https://cdn.jsdelivr.net/npm/lib-flexible@0.3.2/flexible.min.js"></script>`
2. 通过postcss-pxtoremh或postcss-px2rem插件转换px单位为rem
3. 兼容PC或者平板方案，设计最大屏幕宽度 640或1280，避免文档宽度过大，导致排版混乱

#### 为什么可以很好的还原设计稿
1. 设计稿和屏幕宽度都划分了十份，75px相当于设计稿中基本单位，rem是在移动端中基本单位，等比计算，就能等比例的去还原设计稿
2. 移动端设计稿一般都是750px，所以rem = 750 / 10 = 75px
3. 当屏幕宽度为375px时，rem = 375 / 10 = 37.5px
4. 例如100px在设计稿占比 100/750 = x/375,那么这个100px在375px屏幕下，100/75px = x/1rem, x=100/75*1rem=1.33333rem 
5. 375是动态的，不同机型屏幕宽度不同，所以根据rem作为中间衡量单位

#### 有什么不足或问题？
- 需要额外引入js
- 需要缩放meta viewport,可能会留下隐患
- 系统字体大小会影响rem的计算,比如微信中的老人版字体也会导致font-size改变，导致rem计算错误

### 2.等比缩放vw方案
相对于rem方案，兼容性较差，不支持ie8及以下的版本，但大部分主流浏览器都会支持。

#### 原理
1vw等于屏幕比例的1%,设计稿可以分成100份，即 100/750 = 1vw,vw是动态的，所以也可以等比缩放

#### 如何适配？
 添加 postcss-px-to-viewport 插件自动配置设计稿即可

#### 兼容vant设计稿
- 兼容vant设计稿375，可以通过exclude 排除 /node_modules/vant/lib/,
- 或者通过文件导入动态修改，相关链接https://zhuanlan.zhihu.com/p/366664788

#### 有什么不足？
1. 兼容性相对于rem较差，但目前现代浏览器大部分都支持
2. 不能很好适配平板或者PC, 因为PC宽高和移动端的高度相差较大,导致1vw很大,必然会导致比例过大, 仅适用于移动端