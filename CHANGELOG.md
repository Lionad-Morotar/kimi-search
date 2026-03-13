# Changelog

修改版本时别忘了修改 MCP Server 的版本号。

```
const server = new McpServer({
  version: "0.0.1"
})
```

## [0.2.0] - 2026-03-12

### Changed
- 包名从 `kimi-search` 重命名为 `@lionad/kimi-tools-mcp`
- 更新相关文档和代码引用

## [0.1.0] - 2026-03-12

### Added
- 新增 `kimi-fetch` 工具，支持更灵活的网页内容获取
- 添加 `prepublishOnly` 钩子，发布前自动构建

## [0.0.1] - 2026-03-12

### Added
- 初始版本：kimi-search MCP server
- 支持 kimi-search 搜索工具