# 🧠 Skills Library

存放 Data Agent 使用的“四肢”工具函数，负责具体的数学计算和异常检测。

## 包含的技能

1.  **analyzer.py (Python)**
    - 基于 Pandas 的数据分析逻辑。
    - 负责计算环比、同比。
    - 实现了异动阈值检测（如 GMV 跌幅 > 10%）。

2.  **anomaly_detection.js (Node)**
    - 轻量级的异动检测逻辑。
    - 用于实时流数据的监控。

## 为什么这样做？

将具体的计算逻辑从 Agent 的“大脑”中剥离出来，封装成独立的 Skill，既提高了复用性，又降低了 LLM 的计算负担（LLM 不擅长数学，Skill 擅长）。
这是典型的 **Code Interpreter** 模式。