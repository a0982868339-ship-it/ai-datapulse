const { analyzeDailyReport, loadEnv } = require("./utils/core")
const { sendFeishuNotification } = require("./utils/notifier")

const main = async () => {
  const envFromFile = loadEnv()
  const targetDate = process.argv[2]
  const command = process.argv[3] || "分析日报"

  if (!targetDate) {
    console.error("用法: node main.js <YYYY-MM-DD> [分析日报]")
    process.exit(1)
  }

  try {
    const { agentReport, isAnomaly, urgencyTag } = await analyzeDailyReport(targetDate, command)

    process.stdout.write(agentReport)

    const notifyResult = await sendFeishuNotification({
      title: `日报分析 ${urgencyTag}`,
      markdown: agentReport,
      isAnomaly,
      webhook: process.env.FEISHU_WEBHOOK || envFromFile.FEISHU_WEBHOOK,
    })

    if (notifyResult.skipped) {
      process.stderr.write("\n未配置 FEISHU_WEBHOOK，已跳过推送\n")
      return
    }
    process.stderr.write(`\n已推送到飞书，状态码：${notifyResult.statusCode}\n`)
  } catch (error) {
    console.error("❌ 执行失败:", error.message)
    process.exit(1)
  }
}

main()