#!/usr/bin/env node
/**
 * AI Content Detector - Model-assisted detection with Burstiness analysis
 * 
 * Usage:
 *   node detect.js <article_file>
 *   node detect.js <article_file> --output json
 *   node detect.js <article_file> --output json --include-burstiness
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Burstiness Analyzer
 * AI 生成的文本句子长度趋于一致，人类写作长短变化大
 */
function analyzeBurstiness(text) {
  const sentences = text.split(/[。！？\.!?；\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  
  if (sentences.length < 3) {
    return { score: 50, cv: 0, interpretation: '文本过短，无法准确分析突发性' };
  }
  
  // 计算句子长度（中文字符 + 英文单词*5）
  const lengths = sentences.map(s => {
    const chinese = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = (s.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english * 5;
  });
  
  const n = lengths.length;
  const mean = lengths.reduce((a, b) => a + b, 0) / n;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  
  let score;
  if (cv < 0.15) score = 10;
  else if (cv < 0.25) score = 30;
  else if (cv < 0.35) score = 50;
  else if (cv < 0.45) score = 70;
  else score = 90;
  
  let interpretation;
  if (cv < 0.2) interpretation = '句子长度高度一致，AI典型特征';
  else if (cv < 0.35) interpretation = '句子长度相对均匀，可能混入AI内容';
  else if (cv < 0.45) interpretation = '句子长度有变化，符合人类写作习惯';
  else interpretation = '句子长度变化丰富，人类写作特征明显';
  
  return { score, cv: Math.round(cv * 100) / 100, interpretation, sentenceCount: n };
}

// Detection prompt template
const DETECTION_PROMPT = `你是一位专业的AI内容检测专家，擅长识别AI生成的文本特征。请基于维基百科"AI写作特征"指南（WikiProject AI Cleanup 维护），参考腾讯朱雀AI检测原理（困惑度+突发性分析+语义理解），客观分析以下文章。

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
  "burstiness_analysis": {
    "score": "突发性评分 0-100",
    "cv": "变异系数",
    "interpretation": "分析解释"
  },
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

function formatReport(result, outputPath, text) {
  // 先做 burstiness 分析
  const burstiness = analyzeBurstiness(text);
  
  const report = `## 🤖 模型辅助检测报告

### 整体评估
- **预估AI率**：${result.estimated_ai_rate}
- **风险等级**：${result.risk_level === 'low' ? '🟢 低' : result.risk_level === 'medium' ? '🟡 中' : '🔴 高'}
- **核心问题**：${result.core_issue}

### 📊 突发性 (Burstiness) 分析（新增）
- **评分**：${burstiness.score}/100
- **变异系数 (CV)**：${burstiness.cv}
- **句子数量**：${burstiness.sentenceCount || 'N/A'}
- **解析**：${burstiness.interpretation}
${burstiness.score < 50 ? '⚠️ 句子长度过于均匀，AI典型特征' : burstiness.score > 70 ? '✅ 句子长度变化丰富，人类写作特征' : ''}

### 高风险段落
${result.high_risk_paragraphs && result.high_risk_paragraphs.length > 0 
  ? result.high_risk_paragraphs.map(p => `
#### ${p.location}
> ${p.content}

**问题**：${p.issues.join('、')}
**改写建议**：${p.rewrite_suggestion}
`).join('\n')
  : '无明显高风险段落'}

### 低风险段落
${result.low_risk_paragraphs && result.low_risk_paragraphs.length > 0 
  ? result.low_risk_paragraphs.join('、') 
  : '无明显低风险段落'}

### 改写优先级
${result.rewrite_priority && result.rewrite_priority.length > 0
  ? result.rewrite_priority.map((p, i) => `${i + 1}. ${p.location} - ${p.reason}`).join('\n')
  : '无需优先改写段落'}
`;

  if (outputPath === 'json') {
    return JSON.stringify({ ...result, burstiness_analysis: burstiness }, null, 2);
  }
  
  return report;
}

async function detect(filePath, options = {}) {
  const content = extractContent(filePath);
  
  if (!content) {
    console.error('❌ 文件内容为空');
    process.exit(1);
  }

  // 进行 burstiness 分析
  const burstiness = analyzeBurstiness(content);
  
  const prompt = DETECTION_PROMPT.replace('{{ARTICLE_CONTENT}}', content);
  
  console.log('📝 正在分析文章...\n');
  console.log(`📄 文件：${path.basename(filePath)}`);
  console.log(`📏 长度：${content.length} 字符`);
  console.log(`📊 Burstiness 评分：${burstiness.score}/100 (CV: ${burstiness.cv})`);
  console.log(`   ${burstiness.interpretation}\n`);
  
  if (options.includeBurstiness) {
    // 输出 burstiness 结果
    console.log('---BURSTINESS_START---');
    console.log(JSON.stringify(burstiness));
    console.log('---BURSTINESS_END---');
  }
  
  console.log('---PROMPT_START---');
  console.log(prompt);
  console.log('---PROMPT_END---');
}

// CLI
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node detect.js <article_file> [--output json] [--include-burstiness]');
  process.exit(1);
}

const filePath = args[0];
const outputIndex = args.indexOf('--output');
const outputFormat = outputIndex > -1 ? args[outputIndex + 1] : 'markdown';
const includeBurstiness = args.includes('--include-burstiness');

detect(filePath, { output: outputFormat, includeBurstiness });