const fs = require("fs")
const path = require("path")

const loadEnv = () => {
  const envPath = path.join(process.cwd(), ".env")
  const parsed = {}
  if (!fs.existsSync(envPath)) {
    return parsed
  }
  let content = fs.readFileSync(envPath, "utf-8")
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1)
  }
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const index = line.indexOf("=")
      if (index === -1) {
        return
      }
      const key = line.slice(0, index).trim()
      let value = line.slice(index + 1).trim()
      if (!key) {
        return
      }
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      parsed[key] = value
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value
      }
    })
  return parsed
}

module.exports = { loadEnv }