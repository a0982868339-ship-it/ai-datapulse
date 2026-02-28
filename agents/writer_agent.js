const OpenAI = require("openai")
const { loadEnv } = require("../utils/env_loader")

class WriterAgent {
  constructor() {
    loadEnv()
    this.apiKey = process.env.GEMINI_API_KEY
    this.baseURL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/"
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"
  }

  // 生成简报：将数据和诊断转化为 Markdown
  async generateReport(data, diagnosis) {
    if (!this.apiKey) {
      console.warn("⚠️ 未配置 GEMINI_API_KEY，Writer Agent 无法润色，仅输出原始数据")
      return this.simpleReport(data, diagnosis)
    }

    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    })

    const { date, metrics, deltas, anomalies, context } = data
    
    // 构建写作 Prompt
    const prompt = `
你是一位专业的商业分析师助手 (Writer Agent)。
请根据以下数据和分析师给出的诊断结果，生成一份结构清晰、语言专业、包含 Emoji 的 Markdown 业务简报。

【基础数据】
- 日期: ${date}
- GMV: ${metrics.gmv} (环比 ${deltas.gmv.toFixed(2)}%)
- 订单量: ${metrics.orders} (环比 ${deltas.orders.toFixed(2)}%)
- 活跃用户: ${metrics.active_users} (环比 ${deltas.active_users.toFixed(2)}%)
- 配送准时率: ${metrics.delivery_on_time}%
- 订单取消率: ${metrics.cancel_rate}%
- 骑手接单时长: ${metrics.rider_accept_time}s
- 广告 ROI: ${metrics.ad_roi}
- 天气: ${metrics.weather}

【分析师诊断】
- 根因: ${diagnosis.root_cause}
- 影响: ${diagnosis.impact_analysis}
- 建议: ${diagnosis.suggestion}

【要求】
1. 标题必须根据是否有异动 (${anomalies.length > 0 ? "🔴 异动警报" : "🟢 正常"}) 动态生成。
2. 分为“📊 数据概览”、“🧐 异动诊断”、“💡 行动建议”三个板块。
3. 语言风格要像一份正式的日报邮件，简洁有力。
4. 如果是异常（如取消率高），请用加粗强调。
`

    try {
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      })
      return completion.choices[0].message.content
    } catch (error) {
      console.error("Writer Agent 写作失败:", error)
      return this.simpleReport(data, diagnosis)
    }
  }

  // 兜底策略：简单拼接
  simpleReport(data, diagnosis) {
    const { date, metrics, deltas, anomalies } = data
    const urgencyTag = anomalies.length > 0 ? "🔴 异动警报" : "🟢 正常"
    
    return [
      `# 📊 业务日报 ${date} ${urgencyTag}`,
      "",
      "## 数据概览",
      `- GMV: ${metrics.gmv} (环比 ${deltas.gmv.toFixed(2)}%)`,
      `- 订单量: ${metrics.orders} (环比 ${deltas.orders.toFixed(2)}%)`,
      `- 活跃用户: ${metrics.active_users} (环比 ${deltas.active_users.toFixed(2)}%)`,
      `- 配送准时率: ${metrics.delivery_on_time}%`,
      `- 订单取消率: ${metrics.cancel_rate}%`,
      `- 骑手接单时长: ${metrics.rider_accept_time}s`,
      `- 广告 ROI: ${metrics.ad_roi}`,
      `- 天气: ${metrics.weather}`,
      "",
      "## 异动诊断",
      `- 根因: ${diagnosis.root_cause}`,
      `- 影响: ${diagnosis.impact_analysis}`,
      "",
      "## 行动建议",
      `- ${diagnosis.suggestion}`,
    ].join("\n")
  }
}

module.exports = new WriterAgent()