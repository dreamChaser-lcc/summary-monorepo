# 通用工具方法包
使用typescript 编译打包

## typescript 配置选项文档
具体配置请访问
1. https://aka.ms/tsconfig (英文官网)
2. https://www.typescriptlang.org/docs/handbook/compiler-options.html（英文官网-命令行可选项）
3. https://www.tslang.cn/docs/handbook/compiler-options.html（中文官网）

## 初始化typescript配置文件
```bash
tsc --init
```
```json
// tsconfig.json
{
  // "extends": "",
  "compilerOptions": {
    /* Language and Environment */
    "target": "ESNext",                                  /* 兼容语法版本esNext 最新的es规范*/
    
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
    "./src/*"
  ],
  "exclude": ["./dist-ts","node_modules"]
}

```