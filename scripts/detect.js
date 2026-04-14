#!/usr/bin/env node

/**
 * AI Content Detector - Model-assisted detection
 * 
 * Usage:
 *   node detect.js <article_file>
 *   node detect.js <article_file> --output json
 */

const fs = require('fs');
const path = require('path');

// Detection prompt template
const DETECTION_PROMPT = `你是一位专业的AI内容检测专家，擅长识别AI生成的文本特征。请客观分析以下文章，判断其AI生成可能性。

## 检测维度

1. **句式模式**（权重 30%）：AI典型词汇、过度转折、句式工整度
2. **段落结构**（权重 25%）：长度均匀度、开头结尾套路化
3. **情感真实度**（权重 25%）：个人经历、具体细节、观点立场
4. **语言风格**（权重 20%）：口语化程度、行业特色、引用自然度

## 输出格式

```json
{
  "estimated_ai_rate": "XX%",
  "risk_level": "low/medium/high",
  "core_issue": "一句话概括",
  "high_risk_paragraphs": [
    {
      "location": "第X段",
      "content": "原文片段",
      "issues": ["问题1", "问题2"],
      "rewrite_suggestion": "改写建议"
    }
  ],
  "low_risk_paragraphs": ["第X段", "第Y段"],
  "rewrite_priority": [
    {"location": "第X段", "reason": "原因"}
  ]
}
```

## 待检测文章

{{ARTICLE_CONTENT}}`;

function extractContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove YAML frontmatter if exists
  const yamlRegex = /^---\n[\s\S]*?\n---\n/;
  const cleaned = content.replace(yamlRegex, '');
  
  return cleaned.trim();
}

function formatReport(result, outputPath) {
  const report = `## 🤖 模型辅助检测报告

### 整体评估
- **预估AI率**：${result.estimated_ai_rate}
- **风险等级**：${result.risk_level === 'low' ? '🟢 低' : result.risk_level === 'medium' ? '🟡 中' : '🔴 高'}
- **核心问题**：${result.core_issue}

### 高风险段落
${result.high_risk_paragraphs.map(p => `
#### ${p.location}
> ${p.content}

**问题**：${p.issues.join('、')}
**改写建议**：${p.rewrite_suggestion}
`).join('\n')}

### 低风险段落
${result.low_risk_paragraphs.join('、')}

### 改写优先级
${result.rewrite_priority.map((p, i) => `${i + 1}. ${p.location} - ${p.reason}`).join('\n')}
`;

  if (outputPath === 'json') {
    return JSON.stringify(result, null, 2);
  }
  
  return report;
}

async function detect(filePath, options = {}) {
  const content = extractContent(filePath);
  
  if (!content) {
    console.error('❌ 文件内容为空');
    process.exit(1);
  }

  const prompt = DETECTION_PROMPT.replace('{{ARTICLE_CONTENT}}', content);
  
  console.log('📝 正在分析文章...\n');
  console.log(`📄 文件：${path.basename(filePath)}`);
  console.log(`📏 长度：${content.length} 字符\n`);
  
  // This is a placeholder - actual LLM call would be done by the skill
  // The skill will use the configured model to analyze
  console.log('---PROMPT_START---');
  console.log(prompt);
  console.log('---PROMPT_END---');
}

// CLI
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node detect.js <article_file> [--output json]');
  process.exit(1);
}

const filePath = args[0];
const outputIndex = args.indexOf('--output');
const outputFormat = outputIndex > -1 ? args[outputIndex + 1] : 'markdown';

detect(filePath, { output: outputFormat });