# summary-monorepo
monorepo汇总各种项目

## pnpm recursive install
递归安装所有子项目依赖

## pnpm-workspace.yaml
定义工作目录，pnpm install 都是从这里查找, 一个 workspace 的根目录下必须有 pnpm-workspace.yaml 文件
```yaml
packages:
  # all packages in direct subdirs of packages/
  - 'packages/*'
  # all packages in subdirs of components/
  - 'components/**'
  # exclude packages that are inside test directories
  - '!**/test/**'
```

## 添加commitlint提交规范
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

```js
// commitlint.config.js 配置文件
module.exports = {
  extends: [
    '@commitlint/config-conventional'
  ],
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

```bash
# 安装
pnpm install -w commitizen
pnpm install -w cz-conventional-changelog
```
