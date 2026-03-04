# Schema 表单示例项目

本目录提供“Schema 驱动的通用表单”示例代码，包含：
- 类型定义（types.ts）
- 渲染引擎（SchemaForm.ts，基于 Vue 3 渲染函数）
- 示例 Schema（schemas/user.ts）
- 简单挂载示例（demo.ts）

集成思路：业务只维护 Schema，渲染引擎由团队托管，AI 仅生成 Schema，降低对 AI 审查的依赖与风险。

文件说明：
- types.ts：Schema 的字段、校验、联动、数据源等类型定义
- SchemaForm.ts：渲染器（受控数据流 + 内置校验 + 安全联动）
- schemas/user.ts：用户信息表单 Schema 示例
- demo.ts：如何在 Vue 应用中挂载 SchemaForm 的示例

注意：示例依赖 Vue 3（仅作为参考代码，不会自动运行）。请按你的项目依赖进行安装与集成。*** End Patch```}세요! -->
