/**
 * 这是一个模拟的 MCP (Model Context Protocol) Server。
 * 
 * 作用：标准化数据接口，让 Agent 可以统一访问不同的数据源（MySQL/API/File）。
 * 在真实生产环境中，DataAgent 会通过 MCP 协议调用此 Server 获取数据。
 */

class MockMCPServer {
  constructor() {
    this.resources = {
      "daily_sales": "./data/daily_sales.csv",
      "daily_details": "./data/daily_details_{date}.json"
    }
  }

  // 模拟 MCP 的 read_resource 接口
  readResource(uri) {
    console.log(`[MCP Server] 正在读取资源: ${uri}`)
    // 在真实场景中，这里会根据 uri 去查询数据库或调用 API
    // 这里为了演示，直接返回 mock 数据
    if (uri.includes("daily_sales")) {
      return "2026-03-08,3500,245000,..."
    }
    return null
  }

  // 模拟 MCP 的 call_tool 接口
  callTool(name, args) {
    console.log(`[MCP Server] 正在调用工具: ${name}`, args)
    if (name === "get_weather") {
      return { weather: "暴雨", warning: "红色预警" }
    }
    return { error: "Tool not found" }
  }
}

module.exports = new MockMCPServer()