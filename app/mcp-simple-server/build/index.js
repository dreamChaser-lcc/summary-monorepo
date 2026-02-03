#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
/**
 * 这是一个用于教学的简单 MCP Server
 * 它展示了 MCP 的两个核心概念：
 * 1. Resources (资源): 类似于文件或数据源，供 AI 读取
 * 2. Tools (工具): 类似于函数，供 AI 调用执行操作
 */
// 1. 创建 MCP Server 实例
const server = new Server({
    name: "simple-demo-server",
    version: "1.0.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// 模拟一些简单的内存数据
const NOTES = {
    "1": "Hello, this is the first note from MCP!",
    "2": "MCP connects AI to your data.",
};
/**
 * 定义 Resources (资源)
 * 告诉 AI 我们有哪些数据可以读取
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "note://internal/list",
                name: "Note List",
                mimeType: "application/json",
                description: "A list of all available notes",
            },
            // 动态列出每个笔记作为资源
            ...Object.keys(NOTES).map((id) => ({
                uri: `note://internal/${id}`,
                name: `Note ${id}`,
                mimeType: "text/plain",
                description: `Content of note ${id}`,
            })),
        ],
    };
});
/**
 * 读取 Resources (资源)
 * 当 AI 决定读取某个资源时，这里负责返回内容
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const id = url.pathname.replace(/^\//, "");
    // 处理列表资源
    if (url.toString() === "note://internal/list") {
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify(Object.keys(NOTES), null, 2),
                },
            ],
        };
    }
    // 处理单个笔记资源
    const note = NOTES[id];
    if (note) {
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "text/plain",
                    text: note,
                },
            ],
        };
    }
    throw new Error(`Note not found: ${request.params.uri}`);
});
/**
 * 定义 Tools (工具)
 * 告诉 AI 我们可以执行哪些操作
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "calculate_sum",
                description: "Add two numbers together",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number", description: "First number" },
                        b: { type: "number", description: "Second number" },
                    },
                    required: ["a", "b"],
                },
            },
            {
                name: "add_note",
                description: "Add a new note to the system",
                inputSchema: {
                    type: "object",
                    properties: {
                        content: { type: "string", description: "Note content" },
                    },
                    required: ["content"],
                },
            },
        ],
    };
});
/**
 * 执行 Tools (工具)
 * 当 AI 调用工具时，这里执行具体逻辑
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "calculate_sum": {
            // 验证参数
            const args = request.params.arguments;
            if (typeof args.a !== "number" || typeof args.b !== "number") {
                throw new Error("Arguments must be numbers");
            }
            // 执行逻辑
            const sum = args.a + args.b;
            // 返回结果
            return {
                content: [
                    {
                        type: "text",
                        text: `The sum of ${args.a} and ${args.b} is ${sum}`,
                    },
                ],
            };
        }
        case "add_note": {
            const args = request.params.arguments;
            const newId = String(Object.keys(NOTES).length + 1);
            NOTES[newId] = args.content;
            return {
                content: [
                    {
                        type: "text",
                        text: `Note added with ID: ${newId}`,
                    }
                ]
            };
        }
        default:
            throw new Error("Unknown tool");
    }
});
// 启动服务器，使用 Stdio 传输层 (标准输入输出)
const transport = new StdioServerTransport();
await server.connect(transport);
