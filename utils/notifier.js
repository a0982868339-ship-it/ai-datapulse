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

const buildPayload = ({ title, markdown, isAnomaly }) => ({
  msg_type: "interactive",
  card: {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: "plain_text", content: title },
      template: isAnomaly ? "red" : "blue",
    },
    elements: [
      {
        tag: "markdown",
        content: markdown,
      },
    ],
  },
})

const sendFeishuNotification = async ({ title, markdown, isAnomaly, webhook }) => {
  const targetWebhook = webhook || process.env.FEISHU_WEBHOOK
  if (!targetWebhook) {
    return { skipped: true, reason: "NO_WEBHOOK" }
  }
  const payload = buildPayload({ title, markdown, isAnomaly })
  const result = await postJson(targetWebhook, payload)
  return { skipped: false, ...result }
}

module.exports = { sendFeishuNotification }
