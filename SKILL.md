---
name: ai-content-detector
description: "AI 率检测 + 36 种模式识别 + Burstiness 分析。触发：AI检测、AI率、检测文章、detect、朱雀复检。"
---

# AI Content Detector

Node.js 纯统计分析 + LLM 模式匹配。输出 AI 率、高风险段落、改写建议。

## 检测方式

**方式 A — 模型辅助（推荐）**

直接发「AI检测 [文章/路径]」。自动读文件或粘贴内容，输出检测报告。

**方式 B — 朱雀二次验证**

```bash
cd ~/.openclaw/workspace && python3 skills/zhuque-ai-detector/scripts/detect.py
```

AI 率 ≥ 50% 时必须走朱雀。

## 核心规则

- **AI 率阈值**：< 30% 通过 | 30-50% 改高风险段 | ≥ 50% 大改走朱雀
- **误报防御**：完美语法/混合语体/单一特征不作为判据，找特征组合簇
- **硬约束**：终稿禁止出现全角破折号（—/–）
- **改写原则**：保留术语、保留不完美跳跃、删整齐并列；❌ 不要刻意口语化/过度简化

## 命令

```bash
# 统计检测（burstiness + 句式结构分析）
node scripts/detect.js <文章路径>

# Burstiness 分析
node scripts/burstiness.js <文章路径>
```

## 参考

| 文档 | 内容 |
|------|------|
| `references/detailed-guide.md` | 36 种模式表 + 完整工作流 + 改写流程 + Traces 格式 |
| `scripts/detect-prompt.md` | LLM 检测 prompt（36 种模式定义 + 改写原则） |
| `README.md` | 完整说明 |
