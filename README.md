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

# 2.输出commitlint.config.js配置文件(命令行输出文件，容易出现语法错误，还是手动创建commitlint.config.js)
echo "module.exports = {extends: ['@commitlint/config-conventional']};" > commitlint.config.js

# 3.初始化husky
husky init

# 4.添加git hooks钩子文件，在.husky/commit-msg中添加内容,会执行commitlint.config.js中的配置
npx --no -- commitlint --edit $1
```
