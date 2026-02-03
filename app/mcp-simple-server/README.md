# Simple MCP Server Example

这是一个最基础的 MCP Server 示例，用于教学目的。

它展示了如何使用 TypeScript 和 `@modelcontextprotocol/sdk` 构建一个能够提供**数据（Resources）**和**能力（Tools）**的服务器。

## 功能

### 1. Resources (资源)
AI 可以读取这些数据，就像读取文件一样。
- `note://internal/list`: 获取所有笔记 ID 列表
- `note://internal/<id>`: 获取特定笔记的内容

### 2. Tools (工具)
AI 可以调用这些函数来执行操作。
- `calculate_sum(a, b)`: 计算两个数字的和
- `add_note(content)`: 添加一条新笔记

## 目录结构

- `src/index.ts`: 服务器的核心逻辑
- `package.json`: 项目依赖配置

## 如何使用

虽然这是一个独立的 Server，但通常它需要配合支持 MCP 的客户端（如 Claude Desktop 或 Trae）使用。

配置示例（如果是在 Claude Desktop 中）：

```json
{
  "mcpServers": {
    "simple-demo": {
      "command": "node",
      "args": ["D:/project/lcc-github/summary-monorepo/app/mcp-simple-server/build/index.js"]
    }
  }
}
```

## 开发与构建

1. 安装依赖:
   ```bash
   cd app/mcp-simple-server
   npm install
   ```

2. 构建:
   ```bash
   npm run build
   ```

3. 运行 (通常由 MCP Client 自动调用):
   ```bash
   npm start
   ```
