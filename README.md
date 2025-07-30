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

#### 自定义提交提示语（cz-customizable）
可以参考下以下的链接
- https://www.npmjs.com/package/cz-customizable
- https://juejin.cn/post/7421547883378589715

### 配置prettier
- 可以和husky和lint-staged结合使用
- lint-staged 是一个在git暂存文件上运行linters的工具
- husky是可以定义git hooks的工具，即定义git生命周期过程中执行的命令，比如提交前执行代码检查和格式化

#### 安装
```bash
pnpm add -w prettier --save-dev
```
#### 添加配置文件
.prettierrc.js文件
```js
// .prettierrc.js
/** @type {import("prettier").Config} */
const config = {
  trailingComma: 'es5',
  printWidth: 100, //单行长度
  tabWidth: 2, //缩进长度
  useTabs: false, //使用空格代替tab缩进
  semi: true, //句末使用分号
  singleQuote: true, //使用单引号
  quoteProps: 'as-needed', //仅在必需时为对象的key添加引号
  jsxSingleQuote: true, // jsx中使用单引号
  trailingComma: 'all', //多行时尽可能打印尾随逗号
  bracketSpacing: true, //在对象前后添加空格-eg: { foo: bar }
  arrowParens: 'always', //单参数箭头函数参数周围使用圆括号-eg: (x) => x
  requirePragma: false, //无需顶部注释即可格式化
  insertPragma: false, //在已被preitter格式化的文件顶部加上标注
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'ignore', //对HTML全局空白不敏感
  vueIndentScriptAndStyle: false, //不对vue中的script及style标签缩进
  endOfLine: 'lf', //结束行形式
  embeddedLanguageFormatting: 'auto', //对引用代码进行格式化
}

module.exports = config
```
.prettierignore 忽略配置prettier执行的文件
```
# Ignore artifacts:
build
dist
coverage

# Ignore all HTML files:
**/*.html
*.yml
*.yaml
```
#### vscode配置
- 一定要"[javascript]"的指定方式配置，因为这个有可能会被默认配置覆盖，这样指定优先级最高！
- configPatch配置项`值`或者`配置文件中的内容`改变，需要`重新启动`vscode生效，或者 ctrl+shift+p输入`reload window`

```json
// settings.json文件
// .vscode/settings.json
{
  // 两个空格缩进
  "editor.tabSize": 2,
  // "editor.defaultFormatter": "esbenp.prettier-vscode1",
  "[javascript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  // prettier 在项目中的配置路径
  "prettier.configPath": ".prettierrc.js",
}
```

## 使用Volta 管理node版本 

Volta 是一个 JavaScript 工具链管理器，可以帮助你管理 Node.js、npm、yarn 等工具的版本。

### 安装 Volta

#### Windows
```bash下载安装包
# 访问 https://volta.sh/ 下载 Windows 安装包
```

### 基本使用命令

#### 安装和管理 Node.js 版本
```bash
# 安装最新的 LTS 版本
volta install node

# 安装指定版本的 Node.js
volta install node@18.17.0
volta install node@20.5.0

# 查看已安装的 Node.js 版本
volta list node

# 设置全局默认 Node.js 版本
volta install node@18.17.0
```

#### 管理包管理器
```bash
# 安装 npm
volta install npm

# 安装指定版本的 npm
volta install npm@9.8.0

# 安装 yarn
volta install yarn

# 安装 pnpm
volta install pnpm
```

#### 项目级别的工具版本管理
```bash
# 为当前项目固定 Node.js 版本
volta pin node@18.17.0

# 为当前项目固定 npm 版本
volta pin npm@9.8.0

# 为当前项目固定 yarn 版本
volta pin yarn@1.22.19

# 为当前项目固定 pnpm 版本
volta pin pnpm@8.6.0
```

#### 查看和管理工具
```bash
# 查看当前使用的工具版本
volta list

# 查看所有已安装的工具
volta list all

# 查看特定工具的版本
volta list node
volta list npm
volta list yarn

# 查看当前项目的工具配置
volta which node
volta which npm
```

#### 运行特定版本的工具
```bash
# 使用特定版本的 Node.js 运行脚本
volta run --node 16.20.0 -- node script.js

# 使用特定版本的 npm
volta run --npm 8.19.0 -- npm install
```

### 项目配置

当你使用 `volta pin` 命令时，Volta 会在项目的 `package.json` 中添加 `volta` 字段：

```json
{
  "name": "my-project",
  "volta": {
    "node": "18.17.0",
    "npm": "9.8.0"
  }
}
```

### 优势

1. **自动切换**: 进入项目目录时自动切换到项目指定的工具版本
2. **团队协作**: 团队成员使用相同的工具版本，避免环境差异
3. **简单易用**: 无需手动管理多个版本的工具
4. **跨平台**: 支持 Windows、macOS 和 Linux
5. **快速**: 工具切换速度快，不影响开发效率

### 常用工作流

```bash
# 1. 安装 Volta
curl https://get.volta.sh | bash

# 2. 安装 Node.js 和包管理器
volta install node@18.17.0
volta install pnpm@8.6.0

# 3. 在项目中固定版本
cd my-project
volta pin node@18.17.0

# 4. 团队成员克隆项目后，Volta 会自动使用正确的版本
git clone <project-url>
cd project
# Volta 自动切换到 package.json 中指定的版本
pnpm install
```