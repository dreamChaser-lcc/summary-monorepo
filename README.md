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