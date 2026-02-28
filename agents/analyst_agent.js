const OpenAI = require("openai")
const { loadEnv } = require("../utils/env_loader")

class AnalystAgent {
  constructor() {
    loadEnv()
    this.apiKey = process.env.GEMINI_API_KEY
    this.baseURL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/"
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"
  }

  // 分析：调用 LLM 进行异动诊断
  async performDiagnosis(data) {
    if (!this.apiKey) {
      console.warn("⚠️ 未配置 GEMINI_API_KEY，Analyst Agent 无法深度思考，仅做简单陈述")
      return this.simpleAnalysis(data)
    }

    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    })

    const { date, metrics, deltas, anomalies, context } = data
    
    // 构建上下文 Prompt
    let detailContext = ""
    if (context.details) {
      detailContext = `
【深度数据 (Deep Dive)】
- 分时趋势: 重点关注取消率高峰时段 (如 ${context.details.hourly_trend.filter(h => h.cancel_rate > 5).map(h => h.hour).join(", ")})
- 区域表现: ${context.details.region_performance.map(r => `${r.name}(订单${r.orders}/取消${r.cancel_rate}%)`).join("; ")}
- 热销品类: ${context.details.top_selling_categories.map(c => `${c.category}(增幅${c.growth_rate}%)`).join("; ")}
`
    }

    const prompt = `
你是一位资深商业分析师 (Analyst Agent)。
请根据以下业务数据，对 ${date} 的三亚 O2O 业务进行深度异动诊断。

【基础数据】
- GMV: ${metrics.gmv} (环比 ${deltas.gmv.toFixed(2)}%)
- 订单量: ${metrics.orders} (环比 ${deltas.orders.toFixed(2)}%)
- 活跃用户: ${metrics.active_users} (环比 ${deltas.active_users.toFixed(2)}%)

【运营指标】
- 配送准时率: ${metrics.delivery_on_time}%
- 订单取消率: ${metrics.cancel_rate}% (警戒线 5%)
- 骑手接单时长: ${metrics.rider_accept_time}s (警戒线 120s)
- 广告 ROI: ${metrics.ad_roi} (昨日 ${context.prev_roi})
- 天气状况: ${metrics.weather}
${detailContext}

【异常信号】
${anomalies.length > 0 ? anomalies.join(", ") : "无明显异常"}

请输出一份 JSON 格式的诊断结果，不要输出 Markdown，只输出 JSON。包含以下字段：
1. "root_cause": 核心归因（如果存在深度数据，请务必指出具体是哪个时段或区域出了问题）
2. "impact_analysis": 异动对业务的具体影响
3. "suggestion": 针对性的行动建议（必须具体可落地，如针对某区域或某时段的调度建议）

JSON 格式示例：
{
  "root_cause": "...",
  "impact_analysis": "...",
  "suggestion": "..."
}
`

    try {
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // 强制 JSON 输出
      })
      let content = completion.choices[0].message.content
      // 清洗 Markdown 代码块
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\n/, "").replace(/\n```$/, "")
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\n/, "").replace(/\n```$/, "")
      }
      const result = JSON.parse(content)
      return result
    } catch (error) {
      console.error("Analyst Agent 思考失败:", error)
      return this.simpleAnalysis(data)
    }
  }

  // 兜底策略：简单规则判定
  simpleAnalysis(data) {
    const { anomalies, metrics } = data
    if (anomalies.includes("HIGH_CANCEL_RATE")) {
      return {
        root_cause: "运力严重不足",
        impact_analysis: `取消率高达 ${metrics.cancel_rate}%，直接损失 GMV`,
        suggestion: "立即启动运力补贴与调度",
      }
    }
    if (anomalies.includes("GMV_FLUCTUATION")) {
      return {
        root_cause: "业务波动较大",
        impact_analysis: `GMV 环比变化显著`,
        suggestion: "持续关注次日留存",
      }
    }
    return {
      root_cause: "业务平稳",
      impact_analysis: "各项指标正常",
      suggestion: "保持当前运营策略",
    }
  }
}

module.exports = new AnalystAgent()