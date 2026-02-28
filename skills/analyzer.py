import csv
from pathlib import Path


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "daily_sales.csv"


def _load_rows():
    with DATA_PATH.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        return list(reader)


def _to_float(value):
    return float(value)


def check_anomaly(target_date):
    rows = _load_rows()
    index_map = {row["date"]: idx for idx, row in enumerate(rows)}
    if target_date not in index_map:
        return {
            "status": "not_found",
            "is_anomaly": False,
            "drop_rate": "0.00%",
            "context": "",
            "metrics": {},
        }
    idx = index_map[target_date]
    if idx == 0:
        return {
            "status": "no_previous_data",
            "is_anomaly": False,
            "drop_rate": "0.00%",
            "context": rows[idx].get("weather", ""),
            "metrics": rows[idx],
        }
    current = rows[idx]
    previous = rows[idx - 1]
    current_gmv = _to_float(current["gmv"])
    previous_gmv = _to_float(previous["gmv"])
    
    # 计算 GMV 环比变化
    change_rate = 0.0
    if previous_gmv != 0:
        change_rate = (current_gmv - previous_gmv) / previous_gmv
    
    drop_rate = max(0.0, -change_rate) * 100
    drop_rate_text = f"{drop_rate:.2f}%"
    
    # 提取多维指标
    metrics = {
        "weather": current.get("weather", ""),
        "delivery_on_time": current.get("delivery_on_time", "N/A"),
        "cancel_rate": current.get("cancel_rate", "N/A"),
        "rider_accept_time": current.get("rider_accept_time", "N/A"),
        "ad_spend": current.get("ad_spend", "N/A"),
        "ad_roi": current.get("ad_roi", "N/A"),
        "cs_tickets": current.get("cs_tickets", "N/A"),
    }
    
    # 智能诊断上下文构建
    weather_context = current.get("weather", "")
    insights = {}
    
    # 1. 地域性因素 (天气/客流)
    if "暴雨" in weather_context or "台风" in weather_context:
        insights["regional"] = f"天气恶劣({weather_context})，直接抑制用户出行与即时需求。"
    else:
        insights["regional"] = f"天气({weather_context})相对平稳，需排查是否为淡季客流回落。"

    # 2. 流量渠道 (投放效率)
    try:
        current_roi = float(current.get("ad_roi", 0))
        prev_roi = float(previous.get("ad_roi", 0))
        if current_roi < prev_roi * 0.8:
            insights["channel"] = f"投放 ROI 环比大幅下滑({prev_roi}->{current_roi})，流量质量变差或素材疲劳。"
        else:
            insights["channel"] = "投放效率相对稳定，暂未发现明显流量异常。"
    except:
        insights["channel"] = "缺乏有效 ROI 数据，建议检查投放账户。"

    # 3. 服务链条 (履约/客服)
    try:
        cancel_rate_val = float(current.get("cancel_rate", "0").replace("%", ""))
        if cancel_rate_val > 5.0:
            insights["service_chain"] = f"取消率飙升至 {cancel_rate_val}%，履约端出现严重瓶颈(可能因运力不足)。"
        else:
            insights["service_chain"] = f"取消率({cancel_rate_val}%)在可控范围内，履约状态正常。"
    except:
        insights["service_chain"] = "履约数据缺失，无法评估服务质量。"

    is_anomaly = drop_rate > 10 or (metrics.get("weather") == "红色暴雨预警")

    return {
        "status": "anomaly" if is_anomaly else "normal",
        "is_anomaly": is_anomaly,
        "drop_rate": drop_rate_text,
        "context": weather_context,
        "insights": insights,
        "metrics": metrics,
    }
