#!/usr/bin/env node
/**
 * Burstiness Analyzer - 突发性分析
 * 
 * AI 生成的文本句子长度趋于一致，人类写作长短变化大
 * 通过计算句子长度方差来衡量"突发性"
 * 
 * Usage:
 *   node burstiness.js <text>
 *   echo "文本内容" | node burstiness.js
 */

const readline = require('readline');

/**
 * 计算句子长度数组的统计指标
 */
function calculateSentenceStats(sentenceLengths) {
  if (sentenceLengths.length === 0) {
    return { count: 0, mean: 0, variance: 0, cv: 0, score: 0 };
  }
  
  const n = sentenceLengths.length;
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / n;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0; // 变异系数 (Coefficient of Variation)
  
  // Burstiness score: 0-100
  // 人类写作 CV 通常 > 0.4，AI 写作 CV 通常 < 0.2
  // score = (cv - 0.15) / 0.45 * 100，范围 0-100
  let score;
  if (cv < 0.15) {
    score = 10; // AI典型：极度均匀
  } else if (cv < 0.25) {
    score = 30; // AI倾向：较均匀
  } else if (cv < 0.35) {
    score = 50; // 不确定
  } else if (cv < 0.45) {
    score = 70; // 人类倾向：有一定变化
  } else {
    score = 90; // 人类典型：变化丰富
  }
  
  return {
    count: n,
    mean: Math.round(mean * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv * 100) / 100,
    score: score
  };
}

/**
 * 分割文本为句子
 */
function splitIntoSentences(text) {
  // 中文句号、感叹号、问号
  // 英文句子以 . ! ? 结尾
  const sentenceDelimiters = /[。！？\.!?；\n]+/;
  const sentences = text.split(sentenceDelimiters)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 5); // 过滤空句和过短句子
  
  return sentences;
}

/**
 * 计算每个句子的字符长度
 */
function getSentenceLengths(text) {
  const sentences = splitIntoSentences(text);
  return sentences.map(s => {
    // 中文字符按1算，英文单词按平均5算
    const chineseChars = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (s.match(/[a-zA-Z]+/g) || []).length;
    // 返回字符长度估计（中文字符 + 英文单词*平均长度）
    return chineseChars + englishWords * 5;
  });
}

/**
 * 主分析函数
 */
function analyzeBurstiness(text) {
  const lengths = getSentenceLengths(text);
  const stats = calculateSentenceStats(lengths);
  
  // 判断风险
  let risk;
  if (stats.score < 30) {
    risk = 'high'; // AI典型
  } else if (stats.score < 50) {
    risk = 'medium'; // AI倾向
  } else if (stats.score < 70) {
    risk = 'low-medium'; // 不确定
  } else {
    risk = 'low'; // 人类倾向
  }
  
  // 详细分析
  const analysis = {
    risk: risk,
    ai_indicator: stats.score < 50,
    stats: stats,
    interpretation: getInterpretation(stats),
    advice: getAdvice(stats)
  };
  
  return analysis;
}

/**
 * 解释统计结果
 */
function getInterpretation(stats) {
  if (stats.count < 3) {
    return '文本过短，无法准确分析突发性';
  }
  if (stats.cv < 0.2) {
    return '句子长度高度一致，AI典型特征';
  }
  if (stats.cv < 0.35) {
    return '句子长度相对均匀，可能混入AI内容';
  }
  if (stats.cv < 0.45) {
    return '句子长度有变化，符合人类写作习惯';
  }
  return '句子长度变化丰富，人类写作特征明显';
}

/**
 * 获取建议
 */
function getAdvice(stats) {
  if (stats.score < 30) {
    return '建议增加句子长度变化：交替使用短句和长句，打破过于整齐的结构';
  }
  if (stats.score < 50) {
    return '可以尝试在部分段落增加句式变化';
  }
  return '句子长度分布正常';
}

/**
 * 格式化输出
 */
function formatReport(analysis) {
  const { stats, risk, interpretation, advice } = analysis;
  
  let riskLabel;
  switch (risk) {
    case 'high': riskLabel = '🔴 高风险 AI'; break;
    case 'medium': riskLabel = '🟡 中风险 AI'; break;
    case 'low-medium': riskLabel = '🟢 低风险'; break;
    case 'low': riskLabel = '✅ 人类写作'; break;
  }
  
  return `
## 📊 突发性 (Burstiness) 分析

### 统计指标
- 句子数量：${stats.count}
- 平均长度：${stats.mean} 字符
- 标准差：${stats.stdDev}
- 变异系数 (CV)：${stats.cv} ${stats.cv < 0.2 ? '(AI典型)' : stats.cv > 0.4 ? '(人类典型)' : ''}

### 风险评估
- **风险等级**：${riskLabel}
- **AI指示**：${analysis.ai_indicator ? '是 ⚠️' : '否 ✅'}
- **解析**：${interpretation}

### 建议
${advice}
`;
}

// CLI
async function main() {
  let text = '';
  
  if (process.argv.length > 2) {
    // 从命令行参数读取
    text = process.argv.slice(2).join(' ');
  } else {
    // 从 stdin 读取
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    for await (const line of rl) {
      text += line + '\n';
    }
  }
  
  if (!text.trim()) {
    console.log('Usage: node burstiness.js <text>');
    console.log('   or: echo "文本内容" | node burstiness.js');
    process.exit(1);
  }
  
  const analysis = analyzeBurstiness(text);
  console.log(formatReport(analysis));
}

main().catch(console.error);