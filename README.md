# summary-monorepo
monorepo汇总各种项目

优点：
1. 同一个仓库管理多个项目
2. 规范可以统一配置，不需要对每个项目配置
3. 对于不需要跨团队的公共库，能够更好本地调试，项目不合应用项目分离，不需要上传到私服后
4. pnpm 磁盘缓存依赖，项目间的依赖可以共享，减少重复下载
5. 扁平化的依赖，解决了幽灵依赖问题

## 项目结构目录
```
summary-monorepo                                                           
├─ .vscode                                               
│  ├─ extension.json                                     // 一些推荐安装的扩展包
├─ .husky                                                // git hooks 钩子函数                                                                       
├─ app                                                   // monorepo 子应用项目                       
│  ├─ vite-vue                                                            
│  │  ├─ public                                                                
│  │  ├─ src                                                                   
│  │  │  ├─ assets                                                             
│  │  │  ├─ components                                                         
│  │  │  ├─ App.vue                                                            
│  │  │  ├─ main.ts                                                            
│  │  │  ├─ style.css                                                          
│  │  │  └─ vite-env.d.ts                                                      
│  │  ├─ index.html                                                            
│  │  ├─ package.json                                                          
│  │  ├─ pnpm-lock.yaml                                                        
│  │  ├─ README.md                                                             
│  │  ├─ tsconfig.json                                                         
│  │  ├─ tsconfig.node.json                                                    
│  │  └─ vite.config.ts                                                        
│  └─ webpack-react                                                            
│     ├─ build                                            // webpack 配置文件                     
│     │  ├─ webpack.base.config.js                                             
│     │  ├─ webpack.dev.config.js                                              
│     │  └─ webpack.prod.config.js                                             
│     ├─ dist                                                                                    
│     ├─ public                                                                
│     ├─ src                                                                   
│     │  ├─ assets                                                  
│     │  ├─ rem-transform-page                            // rem 适配目录，目录下css单位自动转换成rem                  
│     │  ├─ vw-transform-page                             // vw 适配目录，目录下css单位自动转换成vw                       
│     │  ├─ app.tsx                                                            
│     │  ├─ index.html                                    // 模板文件                     
│     │  ├─ index.tsx                                                          
│     │  ├─ types.d.ts                                    // ts项目声明文件                      
│     ├─ package.json                                                          
│     ├─ postcss.config.js                                                     
│     ├─ README.md                                                             
│     └─ tsconfig.json                                                         
├─ module-federation                                      // 微前端module-federation实践demo
├─ packages                                               // monorepo 共享的包，可以在子应用项目通过pnpm add --filter xxx 直接引入                     
│  └─ utils                                                              
├─ .czrc                                                  // commitizen commit提交规范引用插件                  
├─ .gitignore                                                                      
├─ .npmrc                                                 // npm命令行配置文件   
├─ commitlint.config.js                                   // commitlint 提交规范配置文件                     
├─ package.json                                                                
├─ pnpm-lock.yaml                                                              
├─ pnpm-workspace.yaml                                    // monorepo配置工作目录文件                    
└─ README.md                                                                   
```
## pnpm 的使用
如何实现monorepo项目
1. 安装pnpm
2. 创建并配置pnpm-workspace.yaml工作目录配置文件
3. 创建之后就可以各个子项目中互相引用了

### pnpm-workspace.yaml
定义工作目录(这是monorepo项目能够引用工作目录下的子项目的核心配置)，pnpm install 都是从这里查找, 一个 workspace 的根目录下必须有 pnpm-workspace.yaml 文件
```yaml
packages:
  # all app in direct subdirs of app/
  - 'packages/*'
  # all packages in direct subdirs of packages/
  - 'packages/*'
  # all packages in subdirs of components/
  - 'components/**'
  # exclude packages that are inside test directories
  - '!**/test/**'
```
或者在定义workspace字段
```json
// package.json
{
  "workspaces": {
    "packages": [
      "app/*",
      "packages/*"
    ]
  }
}
```

### 子项目中互相引用作为依赖（工作目录配置可以通过软连接映射到对应的项目依赖中）
例：在app/webpack 项目中引用 packages/utils, 
```bash
# @summary/utils是 packages/utils的包名,在package.json中定义
pnpm add @summary/utils --filter webpack-react
```

### 批量执行命令
```bash
# 批量执行package.json中name为app开头的项目
pnpm run --filter app* dev
# or 只安装packages工作空间中的依赖
pnpm install --recursive --filter packages/*
```

### 安装项目依赖

```bash
# 递归安装所有子项目依赖
pnpm recursive install
# or
pnpm install
# 安装子项目依赖
pnpm install -filter vite-vue
```

### 启动子项目脚本

```bash 
# 批量启动所有子项目的dev命令
pnpm run -w dev
# or --filter 指定运行某个子项目（需要是pnpm-workspace.yaml文件定义的工作目录）
pnpm run --filter webpack-react dev
# or -C 运行路径+子项目app/vite-vue项目的build命令(可以不是pnpm-workspace.yaml文件定义的工作目录)
pnpm run -C app/vite-vue build
```

### 添加子项目依赖
```bash
# 指定webpack-react 子项目安装依赖添加到dependencies
pnpm add react react-dom @types/react @types/react-dom --filter webpack-react
# or -D 安装依赖添加到dependencies
pnpm add momentjs -D --filter webpack-react
# 在根目录添加依赖
pnpm add -w commitizen
```

### .npmrc文件
参考文档 
1. https://docs.npmjs.com/cli/v10/configuring-npm/npmrc
2. https://pnpm.io/zh/npmrc

添加下面配置，之前的-w命令都可以不需要输入
```bash
# 忽略pnpm install -w 没有 -w，会出现报错提示
ignore-workspace-root-check = true
# ...更多配置
```

## 项目规范

下面是常见的项目规范工具，该项目主旨是探索且熟悉一些知识，所以未配置prettier，eslint（其他仓库配置过了，节省时间）
- Prettier 代码格式化工具
- ESLint 代码检查工具
- commitlint+commitizen 提交规范工具
- husky git钩子工具 (可以在代码提交or提交之前执行格式化检查代码，或执行提交规范检查)
- lint-staged git钩子工具
- .vscode 配置文件(统一定义项目编码规范，比如一个tab缩进等于2个空格或4个)

这些配置在根目录下安装依赖 -w，可以统一所有项目的规范，不需要每个子项目单独配置 

### husky+commitlint+commitizen 完成提交规范
在根目录下安装依赖 -w 描述
```bash
# 1.安装commitlint相关依赖，以及git husky
pnpm add -w @commitlint/config-conventional @commitlint/cli husky 

# 2.输出commitlint.config.js配置文件
# !!!(命令行输出文件，容易出现语法错误，还是手动创建commitlint.config.js)
echo "module.exports = {extends: ['@commitlint/config-conventional']};" > commitlint.config.js

# 3.初始化husky
husky init

# 4.添加git hooks钩子文件，在.husky/commit-msg中添加内容,会执行commitlint.config.js中的配置
npx --no -- commitlint --edit $1
```
在package.json中添加脚本
```json
// prepare是会在pnpm install 安装依赖之后执行的脚本,确保每次重新拉取项目的时候，都初始化husky，不然husky定义hooks不会被执行！！！非常重要！！！
// 和prepare脚本会被pnpm install命令隐形触发的脚本还有，preinstall,install,postinstall,相当于pnpm install执行程序的一个生命周期！！！
{
  "scripts":{
    "prepare": "husky"
  }
}
```

#### 添加commitlint配置文件
```js
// commitlint.config.js 配置文件
module.exports = {
  extends: [
    '@commitlint/config-conventional'
  ],
  // 以下rules是自定义覆盖扩展@commitlint/config-conventional的规则
  rules: {
    'type-enum': [
      // type枚举
      2,
      'always',
      [
        'build', // 编译相关的修改，例如发布版本、对项目构建或者依赖的改动
        'feat', // 新功能
        'fix', // 修补bug
        'docs', // 文档修改
        'style', // 代码格式修改, 注意不是 css 修改
        'refactor', // 重构
        'perf', // 优化相关，比如提升性能、体验
        'test', // 测试用例修改
        'revert', // 代码回滚
        'ci', // 持续集成修改
        'config', // 配置修改
        'chore', // 其他改动
      ],
    ],
    'type-empty': [2, 'never'], // never: type不能为空; always: type必须为空
    'type-case': [0, 'always', 'lower-case'], // type必须小写，upper-case大写，camel-case小驼峰，kebab-case短横线，pascal-case大驼峰，等等
    'scope-empty': [0],
    'scope-case': [0],
    'subject-empty': [2, 'never'], // subject不能为空
    'subject-case': [0],
    'subject-full-stop': [0, 'never', '.'], // subject以.为结束标记
    'header-max-length': [2, 'always', 72], // header最长72
    'body-leading-blank': [0], // body换行
    'footer-leading-blank': [0, 'always'], // footer以空行开头
  },
};
```

#### 根目录添加commitizen命令行提示
在commitlint规范要求下，添加命令行提示输入提交规范，避免手动输入出现报错

`之后用git cz代替 git commit 把代码提交`
```bash
# 安装commitizen
pnpm install -g commitizen
# 英文版选择命令行
pnpm install -w cz-conventional-changelog
# 中文版选择命令行
pnpm install -w cz-conventional-changelog-chinese
```
安装后需要添加配置文件，在根目录添加.czrc文件
```json
// .czrc文件
{
  "path":"./node_modules/cz-conventional-changelog-chinese" 
  
  // 或者 "path":"./node_modules/cz-conventional-changelog" 
  // 其他配置可以查看 https://www.npmjs.com/package/cz-conventional-changelog
}
```
或者在package.json中添加配置

```json
// package.json文件
{
  "config": {
    "commitizen": {
      "path":"./node_modules/cz-conventional-changelog-chinese" 
      //or "path": "./node_modules/cz-conventional-changelog"
      //or "path": "cz-conventional-changelog"
    }
  }
}
```
