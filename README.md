# 🔍 AI Content Detector

**纯统计分析版 AI 写作检测器，无需 API 调用，零成本运行**

[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📖 简介

AI Content Detector 是一款轻量级的 AI 写作检测工具，通过纯统计分析方法识别 AI 生成内容。无需调用任何外部 API，零成本运行。

**核心能力**：
- 🔍 **AI 占比检测** - 基于多维度指标计算 AI 写作可能性
- 📊 **Burstiness 分析** - 检测句子长度变化性
- 📚 **TTR 词汇丰富度** - 分析词汇多样性
- 🎯 **AI 句式模板** - 识别典型 AI 写作模式
- ⚡ **零 API 依赖** - 纯本地计算，无需联网

**检测原理**：AI 生成的文本通常具有句子均匀、词汇重复、句式模板化等特征，本工具通过统计这些特征来判断 AI 写作占比。

---

## ✨ 功能特性

### 核心指标

| 指标 | 说明 | AI 特征 | 权重 |
|------|------|---------|------|
| 🌊 Burstiness | 句子长度变化性 | 低（句子均匀） | 25% |
| 📚 TTR | 词汇丰富度 | 低（词汇重复） | 25% |
| 📝 标点模式 | 标点密度和多样性 | 规范、稳定 | 15% |
| 📄 段落结构 | 段落长度变化 | 均匀 | 15% |
| 🤖 AI 句式模板 | 典型 AI 句式关键词 | 高密度 | 20% |

### 输出示例

```
📊 AI 写作检测结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 AI 占比: 76%
👤 人类占比: 24%

📋 各指标评分（AI 可能性）:
  句子变化性 (Burstiness): 95%
  词汇丰富度 (TTR): 15%
  标点模式: 80%
  段落结构: 70%
  AI 句式模板: 98%

💡 结论:
  ⚡ 可能包含 AI 生成的部分
```

### 结论判断

| AI 占比 | 结论 | 说明 |
|---------|------|------|
| ≥80% | ⚠️ 高度疑似 AI 生成 | 大部分内容符合 AI 特征 |
| 60-79% | ⚡ 可能包含 AI 生成部分 | 存在明显 AI 痕迹 |
| 40-59% | 🔀 混合内容 | 难以明确判断 |
| <40% | ✅ 更像人类写作 | AI 特征不明显 |

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/skystmm/ai-content-detector.git
cd ai-content-detector

# 直接使用（Node.js 18+）
node index.js --test
```

### 基础使用

#### 1️⃣ 检测文本

```bash
# 直接输入文本
node index.js "这是一段需要检测的文本内容..."

# 从文件读取
node index.js /path/to/article.txt

# 测试模式（内置样例）
node index.js --test
```

#### 2️⃣ 模型辅助检测（推荐）

```bash
# 使用 LLM 辅助分析（输出检测 Prompt）
node scripts/detect.js article.txt

# 该脚本会生成标准化的检测 Prompt
# 由 OpenClaw Skill 调用 LLM 进行分析
```

**输出包含**：
- 预估 AI 率
- 高风险段落 + 改写建议
- 低风险段落
- 改写优先级

#### 3️⃣ 在代码中使用

```javascript
const { AIDetector } = require('./index.js');

// 创建检测器实例
const detector = new AIDetector();

// 检测文本
const text = "这是一段需要检测的文本...";
const result = detector.detect(text);

console.log(`AI 占比: ${result.aiRatio}%`);
console.log(`结论: ${result.conclusion}`);
```

---

## 📖 技术原理

### 1. Burstiness（突发性）

AI 生成的文本句子长度通常比较均匀，而人类写作的句子长度变化更大。

```javascript
// 计算公式
burstiness = Math.sqrt(variance) / mean;

// 判断标准
// burstiness < 0.3 → AI 特征
// burstiness > 0.5 → 人类特征
```

**原理**：AI 倾向于生成"安全"的句子结构，避免过短或过长的句子。

### 2. TTR（词汇丰富度）

Type-Token Ratio，衡量词汇多样性。

```javascript
// 计算公式
TTR = uniqueWords / totalWords;

// 判断标准
// TTR < 0.4 → AI 特征（词汇重复）
// TTR > 0.5 → 人类特征（词汇丰富）
```

**原理**：AI 模型倾向于使用高频词汇，词汇重复率更高。

### 3. AI 句式模板检测

检测常见的 AI 写作模板关键词：

| 模板类型 | 示例关键词 |
|---------|-----------|
| 序列词 | 首先、其次、然后、最后 |
| 总结词 | 总之、综上所述、总而言之 |
| 过渡词 | 值得注意的是、需要注意的是 |
| 对比词 | 一方面、另一方面 |
| 解释词 | 具体来说、换句话说、换言之 |

**权重**：检测到 4+ 个模板关键词 → 98% AI 可能性

---

## 🎯 使用场景

### 场景 1：博客文章原创性评估

```bash
# 检测文章 AI 占比
node index.js blog_article.txt

# 输出
# 🤖 AI 占比: 35%
# ✅ 更像人类写作
```

### 场景 2：公众号内容审核

```bash
# 批量检测目录下所有文章
for file in articles/*.txt; do
  echo "=== $file ==="
  node index.js "$file"
done
```

### 场景 3：学术论文辅助判断

```bash
# 检测论文章节
node index.js paper_introduction.txt
node index.js paper_methodology.txt
```

---

## 📊 准确度

基于测试样例：

| 文本类型 | AI 占比检测结果 | 准确度 |
|---------|----------------|--------|
| 纯 AI 生成 | 70-85% | ~76% |
| 纯人类写作 | 25-45% | ~62% (正确判断) |
| 混合内容 | 50-70% | 需人工复核 |

**对比参考**：
- GPTZero: 85-90% 准确度（需 API）
- 本工具: ~76% 准确度（纯本地，零成本）

**建议**：本工具适合快速筛查，建议结合人工判断做最终决定。

---

## ⚠️ 局限性

1. **短文本不可靠** - <50 字检测结果不稳定
2. **混合内容困难** - 人类改写 AI 内容难以判断
3. **中文优化** - 当前针对中文文本优化，英文需调整参数
4. **专业领域** - 技术文档、学术论文等特殊文体可能误判

---

## 🏗️ 项目结构

```
ai-content-detector/
├── index.js            # 纯统计分析检测（Burstiness、TTR）
├── scripts/
│   ├── detect.js       # 模型辅助检测脚本
│   └── detect-prompt.md # LLM 检测 Prompt 模板
├── package.json        # Node.js 配置
├── README.md           # 本文档
└── SKILL.md            # OpenClaw Skill 文档（完整工作流）
```

---

## 🔮 扩展计划

- [x] 模型辅助判断（已实现 `scripts/detect.js`）
- [x] Traces 记录（SKILL.md 工作流）
- [x] 改写建议（检测报告输出）
- [ ] 英文文本检测支持
- [ ] 更多 AI 句式模板
- [ ] 本地小模型集成（Perplexity 计算）
- [ ] Web API 接口
- [ ] 批量处理模式

---

## 🛠️ 技术栈

- **Node.js 18+** - 运行环境
- **纯 JavaScript** - 无外部依赖
- **正则表达式** - 句式模板匹配
- **统计计算** - Burstiness、TTR 等指标

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 👨💻 作者

**Sky** - [@skystmm](https://github.com/skystmm)

---

## 🙏 致谢

- Burstiness 理论 - 句子变化性研究
- TTR 理论 - 词汇丰富度研究
- GPTZero 等 AI 检测工具 - 提供思路参考

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

[报告问题](https://github.com/skystmm/ai-content-detector/issues) · [请求功能](https://github.com/skystmm/ai-content-detector/issues)

</div>