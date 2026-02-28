const express = require("express")
const { analyzeDailyReport, loadEnv } = require("./utils/core")
const { sendFeishuNotification } = require("./utils/notifier")

const app = express()

// 加载环境变量
loadEnv()
const PORT = process.env.PORT || 3001

// 健康检查
app.get("/status", (req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() })
})

// 触发分析 (GET /trigger?date=2026-03-08)
app.get("/trigger", async (req, res) => {
  const targetDate = req.query.date
  if (!targetDate) {
    return res.status(400).send({ error: "Missing 'date' query parameter. Example: /trigger?date=2026-03-08" })
  }

  try {
    console.log(`📡 收到触发请求: ${targetDate}`)
    const { agentReport, isAnomaly, urgencyTag } = await analyzeDailyReport(targetDate, "HTTP 触发")

    const notifyResult = await sendFeishuNotification({
      title: `日报分析 ${urgencyTag}`,
      markdown: agentReport,
      isAnomaly,
      webhook: process.env.FEISHU_WEBHOOK,
    })

    if (notifyResult.skipped) {
      return res.send({ message: "分析完成，但未配置 Webhook 跳过推送", report: agentReport })
    }

    res.send({
      message: "✅ 分析完成并已推送到飞书",
      feishu_status: notifyResult.statusCode,
      report_preview: agentReport.slice(0, 100) + "...",
    })
  } catch (error) {
    console.error("❌ 处理失败:", error.message)
    res.status(500).send({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`)
  console.log(`👉 试一试: http://localhost:${PORT}/trigger?date=2026-03-08`)
})