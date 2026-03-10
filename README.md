# Kimi Search MCP Server

MCP 服务器，借助 kimi-cli 的力量实现网络搜索功能。

## config

```json
{
  "mcpServers": {
    "kimi-search": {
      "command": "npx",
      "args": ["-y", "@lionad/kimi-search"]
    }
  }
}
```

## tools

* **kimi-search**: 将 kimi 作为智能代理执行复杂的搜索和分析任务（是 `kimi -p "搜索网络: xxx"` 的一层包装）
