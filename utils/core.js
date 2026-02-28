const DataAgent = require("../agents/data_agent")
const AnalystAgent = require("../agents/analyst_agent")
const WriterAgent = require("../agents/writer_agent")
const { loadEnv } = require("./env_loader")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const logStep = (agent, message, emoji = "🔹") => {
  console.log(`${emoji} [${agent}] ${message}`)
}

const analyzeDailyReport = async (targetDate, command = "分析日报") => {
  console.log("\n========================================")
  console.log("   🤖 OpenClaw Agent System Starting   ")
  console.log("========================================\n")

  // 1. 确保环境变量已加载
  loadEnv()

  // 2. Data Agent: 感知与取数
  const startData = Date.now()
  logStep("Data Agent", `正在读取 CSV 并扫描 ${targetDate} 的业务指标...`, "📡")
  await sleep(500) // 模拟处理耗时，增加观赏性
  const data = DataAgent.analyzeMetrics(targetDate)
  console.log(`   └─ 发现 ${data.anomalies.length} 个异动指标: ${data.anomalies.join(", ") || "无"}`)
  console.log(`   └─ 耗时: ${Date.now() - startData}ms\n`)
  
  // 3. Analyst Agent: 深度思考与诊断
  const startAnalyst = Date.now()
  logStep("Analyst Agent", "正在调用 LLM 进行深度异动归因...", "🧠")
  const diagnosis = await AnalystAgent.performDiagnosis(data)
  console.log(`   └─ 诊断结论: ${diagnosis.root_cause}`)
  console.log(`   └─ 耗时: ${Date.now() - startAnalyst}ms\n`)

  // 4. Writer Agent: 撰写简报
  const startWriter = Date.now()
  logStep("Writer Agent", "正在生成专业 Markdown 简报...", "✍️")
  const agentReport = await WriterAgent.generateReport(data, diagnosis)
  console.log(`   └─ 简报生成完毕 (${agentReport.length} 字符)`)
  console.log(`   └─ 耗时: ${Date.now() - startWriter}ms\n`)

  const isAnomaly = data.isAnomaly
  const urgencyTag = isAnomaly ? "🔴 异动警报" : "🟢 正常"

  console.log("✅ 全流程执行完毕，准备推送...")
  console.log("----------------------------------------")

  return { agentReport, isAnomaly, urgencyTag }
}

module.exports = { analyzeDailyReport, loadEnv }