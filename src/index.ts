#!/usr/bin/env node
/**
 * kimi-search MCP Server
 *
 * 此服务器将 kimi 作为智能代理(agent)暴露给 MCP 客户端，
 * 支持执行复杂的搜索、分析和信息整合任务。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Zod 模式用于输入验证
const AgentInstructionSchema = z.object({
  instruction: z.string()
    .min(1, "指令不能为空")
    .max(5000, "指令不能超过 5000 个字符")
    .describe(`完整的任务指令，描述需要 kimi-search 执行的搜索或分析任务。

指令应包含：
1. 搜索关键词或搜索主题
2. 具体目标（要获取什么信息）
3. 执行步骤（如何获取和处理信息）
4. 输出格式要求

示例指令：
---
搜索："bun package manager vs pnpm benchmark 2025"

目标：了解 Bun 作为新兴 JavaScript 包管理器与 pnpm 的对比，包括性能基准测试和功能差异

使用 WebSearch 工具执行网络搜索。
对于每个相关结果：
1. 使用 WebFetch 或浏览器工具获取页面内容
2. 提取与搜索目标相关的关键发现
3. 记录：URL、标题、要点、相关度评分（1-5）

以以下格式返回结构化结果：
\`\`\`
## {query}

### 结果 1：{title}
- URL: {url}
- 相关度：{1-5}/5
- 关键发现：
  - {要点}
- 引用：
  - "{相关摘录}"
\`\`\`

关注事实信息和有数据支持的论断。
---`)
}).strict();

type AgentInstruction = z.infer<typeof AgentInstructionSchema>;

// 执行 kimi-search 任务
async function executeKimiAgent(_instruction: string): Promise<string> {
  const instruction = `## Context\n* use 90 seconds timeout for tools\n\n以下是具体的网络搜索或分析任务\n\n---\n\n${_instruction}`
  try {
    const { stdout } = await execFileAsync("kimi", [
      "-p",
      instruction,
      "--print",
      "--output-format",
      "stream-json",
      "--final-message-only"
    ], {
      timeout: 180000, // 3 分钟超时，给 agent 足够时间完成复杂任务
      maxBuffer: 10 * 1024 * 1024 // 10MB 缓冲区
    });

    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        throw new Error("未找到 kimi 命令。请确保 kimi CLI 已安装并添加到 PATH 中。");
      }
      if (error.message.includes("ETIMEDOUT")) {
        throw new Error("任务执行超时。kimi-search 可能需要更长时间处理复杂任务，请稍后重试或简化任务。");
      }
      throw new Error(`任务执行失败: ${error.message}`);
    }
    throw error;
  }
}

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "kimi-search-mcp-server",
  version: "0.0.1"
});

// 注册 kimi-search 工具
server.registerTool(
  "kimi-search",
  {
    title: "kimi-search",
    description: `将 kimi 作为智能代理(agent)执行复杂的搜索和分析任务。

与简单的搜索工具不同，kimi-search 可以：
- 进行多步骤的网络搜索
- 分析和比较多个信息源
- 生成结构化的报告和总结
- 执行需要推理的复杂查询

参数：
  - instruction (string): 完整的任务指令，包含搜索关键词、目标、执行步骤和输出格式要求

返回值：
  kimi-search 完成任务的完整输出，通常包含搜索结果、分析或总结。

使用场景对比：
  ❌ 不适合：简单的关键词查询（如 "React"）
  ✅ 适合：结构化的任务指令（包含目标、步骤、格式要求）

示例指令结构：
---
搜索："bun package manager vs pnpm benchmark 2025"

目标：了解 Bun 作为新兴 JavaScript 包管理器与 pnpm 的对比

执行步骤：
1. 使用 WebSearch 工具执行网络搜索
2. 对于每个相关结果，获取页面内容
3. 提取关键发现，记录 URL、标题、要点、相关度评分

输出格式：
## {query}
### 结果 1：{title}
- URL: {url}
- 相关度：{1-5}/5
- 关键发现：...
---

注意事项：
  - 需要安装 kimi CLI 工具
  - 复杂任务可能需要较长时间（最长 5 分钟）
  - 指令越详细，结果质量越高`,
    inputSchema: AgentInstructionSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (params: AgentInstruction) => {
    try {
      const result = await executeKimiAgent(params.instruction);

      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `任务执行出错: ${errorMessage}`
        }]
      };
    }
  }
);

// 主函数
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kimi-search MCP Server 正在通过 stdio 运行");
}

main().catch(error => {
  console.error("服务器错误:", error);
  process.exit(1);
});
