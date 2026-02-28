const https = require("https")
const { URL } = require("url")

const postJson = (webhookUrl, payload) =>
  new Promise((resolve, reject) => {
    const url = new URL(webhookUrl)
    const data = JSON.stringify(payload)
    const request = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (response) => {
        let body = ""
        response.setEncoding("utf-8")
        response.on("data", (chunk) => {
          body += chunk
        })
        response.on("end", () => {
          resolve({ statusCode: response.statusCode, body })
        })
      }
    )
    request.on("error", reject)
    request.write(data)
    request.end()
  })

const detectWebhook = () => {
  if (process.env.FEISHU_WEBHOOK) {
    return { type: "feishu", url: process.env.FEISHU_WEBHOOK }
  }
  if (process.env.DINGTALK_WEBHOOK) {
    return { type: "dingtalk", url: process.env.DINGTALK_WEBHOOK }
  }
  return null
}

const buildPayload = (type, markdownText, title) => {
  if (type === "feishu") {
    return {
      msg_type: "interactive",
      card: {
        header: { title: { tag: "plain_text", content: title } },
        elements: [
          {
            tag: "markdown",
            content: markdownText,
          },
        ],
      },
    }
  }
  if (type === "dingtalk") {
    return {
      msgtype: "markdown",
      markdown: {
        title,
        text: markdownText,
      },
    }
  }
  throw new Error("Unsupported webhook type")
}

const sendMarkdownReport = async (markdownText, title) => {
  const webhook = detectWebhook()
  if (!webhook) {
    return { skipped: true, reason: "NO_WEBHOOK" }
  }
  const payload = buildPayload(webhook.type, markdownText, title)
  const result = await postJson(webhook.url, payload)
  return { skipped: false, type: webhook.type, ...result }
}

module.exports = {
  sendMarkdownReport,
}
