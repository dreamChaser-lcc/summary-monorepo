
## 安装loader依赖

```bash
pnpm add html-webpack-plugin ts-loader @babel/core babel-loader --filter webpack-react
```

## 安装typescript
```bash
pnpm add -w typescript 
# and 初始化配置文件tsconfig.json
npx tsc --init
```

## 安装React
```bash
pnpm add @types/react @types/react-dom --filter webpack-react
```

## webpack相关
```bash
 pnpm add webpack webpack-cli webpack-dev-server --filter webpack-react
```

## 运行工作空间的中的单个项目脚本
```bash
pnpm run -C packages/webpack-react dev
```

## postcss-loader 

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
### 如何查看支持的列表?
通过以下命令会打印到控制台,显示出语法兼容的浏览器版本
```bash
npm install -g browserslist
# and
npx browserslist
```
文档:[browserslist](https://github.com/browserslist/browserslist)