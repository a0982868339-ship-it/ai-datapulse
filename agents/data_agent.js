const fs = require("fs")
const path = require("path")

class DataAgent {
  constructor() {
    this.csvPath = path.join(process.cwd(), "data", "daily_sales.csv")
  }

  // 感知：读取并标准化数据
  loadData() {
    if (!fs.existsSync(this.csvPath)) {
      throw new Error(`数据文件未找到: ${this.csvPath}`)
    }
    const content = fs.readFileSync(this.csvPath, "utf-8").trim()
    const lines = content.split(/\r?\n/).filter(Boolean)
    const headers = lines[0].split(",")
    return lines.slice(1).map((line) => {
      const cells = line.split(",")
      return headers.reduce((acc, header, index) => {
        acc[header] = cells[index]
        return acc
      }, {})
    })
  }

  // 感知：读取详细 JSON 数据
  loadDetails(targetDate) {
    const jsonPath = path.join(process.cwd(), "data", `daily_details_${targetDate}.json`)
    if (fs.existsSync(jsonPath)) {
      try {
        return JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
      } catch (e) {
        console.warn(`[DataAgent] 详细数据解析失败: ${jsonPath}`)
      }
    }
    return null
  }

  // 深度思考：计算环比并检测异动
  analyzeMetrics(targetDate) {
    const rows = this.loadData()
    const details = this.loadDetails(targetDate)
    
    const indexMap = rows.reduce((acc, row, index) => {
      acc[row.date] = index
      return acc
    }, {})

    const idx = indexMap[targetDate]
    if (idx === undefined) {
      throw new Error(`未找到指定日期 ${targetDate} 的数据`)
    }

    const current = rows[idx]
    const previous = idx > 0 ? rows[idx - 1] : null

    const toNumber = (val) => Number(val || 0)
    const toPercent = (val) => (val ? parseFloat(val.replace("%", "")) : 0)

    const metrics = {
      gmv: toNumber(current.gmv),
      orders: toNumber(current.orders),
      active_users: toNumber(current.active_users),
      delivery_on_time: toPercent(current.delivery_on_time),
      cancel_rate: toPercent(current.cancel_rate),
      rider_accept_time: toNumber(current.rider_accept_time?.replace("s", "")),
      ad_roi: toNumber(current.ad_roi),
      weather: current.weather,
    }

    // 计算环比
    const deltas = {}
    if (previous) {
      const calcDelta = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : 0)
      deltas.gmv = calcDelta(metrics.gmv, toNumber(previous.gmv))
      deltas.orders = calcDelta(metrics.orders, toNumber(previous.orders))
      deltas.active_users = calcDelta(metrics.active_users, toNumber(previous.active_users))
    }

    // 异动判定逻辑 (Skills)
    const anomalies = []
    if (Math.abs(deltas.gmv) > 10) anomalies.push("GMV_FLUCTUATION")
    if (metrics.cancel_rate > 5) anomalies.push("HIGH_CANCEL_RATE")
    if (metrics.ad_roi < 1.5) anomalies.push("LOW_ROI")
    if (metrics.rider_accept_time > 120) anomalies.push("SLOW_RIDER_RESPONSE")

    // 如果有详细数据，进行更深入的扫描
    if (details) {
      // 检查分时异动
      const badHours = details.hourly_trend?.filter(h => h.cancel_rate > 5 || h.accept_time > 120)
      if (badHours && badHours.length > 0) {
        anomalies.push(`HOURLY_PEAK_PRESSURE (${badHours.length}个时段异常)`)
      }
      // 检查区域异动
      const badRegions = details.region_performance?.filter(r => r.cancel_rate > 5)
      if (badRegions && badRegions.length > 0) {
        anomalies.push(`REGIONAL_IMBALANCE (${badRegions.map(r => r.name.split("/")[0]).join(", ")})`)
      }
    }

    return {
      date: targetDate,
      metrics,
      deltas,
      anomalies,
      isAnomaly: anomalies.length > 0,
      context: {
        weather: current.weather,
        prev_roi: previous ? toNumber(previous.ad_roi) : null,
        details: details // 将详细数据传递给下游
      },
    }
  }
}

module.exports = new DataAgent()