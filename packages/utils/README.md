# 通用工具方法包
使用typescript ts编译打包,输出js文件和d.ts声明文件

## 主旨
1. 封装常用工具方法(后续会添加更多内容)
2. 熟悉ts构建打包，并输入文件
3. 熟悉monorepo开发公共工具库的流程
4. 熟悉常见模块化打包和导入，如commonjs,esModule,umd(兼容前两种的模块化,内置判断)

## 构建项目
安装依赖后执行构建脚本
```bash
pnpm run --filter utils build:ts
```

## 项目目录结构
```
utils                       
├─ dist                                       // 打包后输出文件         
│  ├─ lib                                     // 输出的js文件
│  │  ├─ canvas-tools.js    
│  │  ├─ envi.js            
│  │  ├─ index.js           
│  │  ├─ testUtils.js       
│  │  └─ _setup.js          
│  └─ types                                   // 输出的d.ts类型声明文件
│     ├─ canvas-tools.d.ts  
│     ├─ envi.d.ts          
│     ├─ index.d.ts         
│     ├─ testUtils.d.ts     
│     └─ _setup.d.ts        
├─ src                                        // 源码
│  ├─ canvas-tools.ts       
│  ├─ envi.ts               
│  ├─ index.ts              
│  ├─ testUtils.ts          
│  └─ _setup.ts             
├─ package.json             
├─ README.md                
└─ tsconfig.json                             // ts配置文件
```

## typescript 配置选项文档
具体配置请访问
1. https://aka.ms/tsconfig  (英文官网)
2. https://www.typescriptlang.org/docs/handbook/compiler-options.html （英文官网-命令行编译可选项）
3. https://www.tslang.cn/docs/handbook/compiler-options.html （中文官网）

## 初始化typescript配置文件
```bash
tsc --init
```
配置相关编译选项
```json
// tsconfig.json
{
  // "extends": "",
  "compilerOptions": {
    /* Language and Environment */
    "target": "ESNext",                                  /* 兼容语法版本esNext 最新的es规范*/
    "lib": ["dom", "es2017"],                            /* 使用一些库，dom可以避免Window等一些浏览器API报错，需要搭配es2017*/
    
    /* Modules */
    "module": "CommonJS",                                /* 输出的模块化类型 */
    "baseUrl": ".",                                      /* 项目的根目录 */
    "paths": {                                           /* 别名 */ 
      "@/*": ["src/*"]
    },
                                         
    /* JavaScript Support */
    // "allowJs": true,                                  /* Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. */
    // "checkJs": true,                                  /* Enable error reporting in type-checked JavaScript files. */

    /* Emit(打包发出相关的配置) */
    "declaration": true,                                 /* 是否生成声明文件 */
    "outDir": "./dist/lib",                              /* 输出文件目录 */
    "stripInternal": true,                               /* 注释内声明@internal的类型，则不生成声明文件 */
    "declarationDir": "./dist/types",                    /* 声明文件d.ts的输出目录 */

    /* Interop Constraints */
    "allowSyntheticDefaultImports": true,                /* Allow 'import x from y' when a module doesn't have a default export. */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */

    /* Type Checking */
    "strict": true,                                      /* 严格模式 */
    "noImplicitAny": false,                              /* 取消检查any */
    "noImplicitReturns": true,                           /* Enable error reporting for codepaths that do not explicitly return in a function. */
  },
  "include": [
    "src/**.ts"
  ],
  "exclude": ["dist","./dist-ts","node_modules"]
}

```

## 打包编译
```bash
tsc -p ./tsconfig.json
```

### 如何使用打包后的编译文件
```json
// package.json
{
   // 1.指定包的入口路径
   "main": "dist/lib/index.js",
   // 2.指定类型声明文件路径  
   "types": "dist/types/index.d.ts",
}
```