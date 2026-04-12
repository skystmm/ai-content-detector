#!/usr/bin/env node

/**
 * AI Content Detector - Pure Statistical Analysis
 * 基于 Burstiness 和统计特征检测 AI 写作占比
 * 
 * 核心指标：
 * 1. Burstiness（突发性） - 句子长度方差、变化范围
 * 2. Vocabulary Richness（词汇丰富度） - TTR
 * 3. Punctuation Patterns（标点模式） - AI 常用标点更规范
 * 4. Sentence Structure（句式结构） - AI 句式更单一
 */

const fs = require('fs');

/**
 * 中文分词（简化版：按标点和空格分割）
 */
function tokenize(text) {
  // 移除多余空格
  text = text.trim();
  
  // 按标点分割句子
  const sentences = text.split(/[。！？；\n]+/).filter(s => s.trim().length > 0);
  
  // 每句按词分割（中文字符 + 标点）
  const words = [];
  for (const sentence of sentences) {
    // 中文按字符，英文按空格
    const tokens = sentence.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+|[0-9]+|[，、：；。！？""''（）【】]/g) || [];
    words.push(...tokens);
  }
  
  return { sentences, words };
}

/**
 * 计算 Burstiness（句子长度突发性）
 * AI 文本：句子长度方差小，变化平稳
 * 人类文本：句子长度方差大，长短交替
 */
function calculateBurstiness(sentences) {
  const lengths = sentences.map(s => s.length).filter(l => l > 0);
  
  if (lengths.length < 2) return { burstiness: 0, variance: 0, meanLength: 0 };
  
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, l) => a + Math.pow(l - mean, 2), 0) / lengths.length;
  
  // Burstiness = variance / mean（标准化）
  // 高 burstiness = 人类特征；低 burstiness = AI 特征
  const burstiness = Math.sqrt(variance) / mean;
  
  return {
    burstiness: burstiness,
    variance: variance,
    meanLength: mean,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    lengthRange: Math.max(...lengths) - Math.min(...lengths)
  };
}

/**
 * 计算 TTR（Type-Token Ratio，词汇丰富度）
 * AI 文本：词汇重复率高，TTR 较低
 * 人类文本：词汇多样，TTR 较高
 */
function calculateTTR(words) {
  const contentWords = words.filter(w => 
    !/[，。！？；：""''（）【】\s]/.test(w) && w.length > 1
  );
  
  if (contentWords.length < 10) return { ttr: 0, uniqueWords: 0, totalWords: 0 };
  
  const uniqueWords = new Set(contentWords).size;
  const ttr = uniqueWords / contentWords.length;
  
  return {
    ttr: ttr,
    uniqueWords: uniqueWords,
    totalWords: contentWords.length,
    repetitionRate: 1 - ttr
  };
}

/**
 * 分析标点符号使用模式
 * AI 文本：标点使用更规范、频率稳定
 * 人类文本：标点使用更随意、变化大
 */
function analyzePunctuation(text) {
  const punctCounts = {
    comma: (text.match(/[，,]/g) || []).length,
    period: (text.match(/[。.]/g) || []).length,
    exclamation: (text.match(/[！!]/g) || []).length,
    question: (text.match(/[？?]/g) || []).length,
    quote: (text.match(/[""''""]/g) || []).length,
    colon: (text.match(/[：:]/g) || []).length
  };
  
  const totalPunct = Object.values(punctCounts).reduce((a, b) => a + b, 0);
  const totalChars = text.length;
  
  // 标点密度
  const punctDensity = totalPunct / totalChars;
  
  // 标点多样性（使用了多少种标点）
  const punctVariety = Object.values(punctCounts).filter(c => c > 0).length;
  
  return {
    punctCounts,
    punctDensity,
    punctVariety,
    totalPunct
  };
}

/**
 * 分析段落结构
 * AI 文本：段落长度较均匀
 * 人类文本：段落长度变化大
 */
function analyzeParagraphs(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length < 2) return { paraVariance: 0, paraMeanLength: 0 };
  
  const lengths = paragraphs.map(p => p.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, l) => a + Math.pow(l - mean, 2), 0) / lengths.length;
  
  return {
    paraCount: paragraphs.length,
    paraMeanLength: mean,
    paraVariance: variance,
    paraLengthRange: Math.max(...lengths) - Math.min(...lengths)
  };
}

/**
 * 检测句式重复模式
 * AI 文本：句式结构重复率高（如"首先...其次...最后..."）
 */
function detectSentencePatterns(sentences) {
  // 检测常见 AI 句式模板
  const aiPatterns = [
    /首先/,
    /其次/,
    /然后/,
    /最后/,
    /总之/,
    /综上所述/,
    /值得注意的是/,
    /一方面/,
    /另一方面/,
    /具体来说/,
    /换句话说/,
    /因此/,
    /所以/
  ];
  
  let patternCount = 0;
  const matchedPatterns = [];
  
  for (const sentence of sentences) {
    for (const pattern of aiPatterns) {
      if (pattern.test(sentence)) {
        patternCount++;
        matchedPatterns.push(pattern.source);
      }
    }
  }
  
  return {
    patternCount,
    matchedPatterns,
    patternDensity: patternCount / sentences.length
  };
}

/**
 * 综合 AI 写作占比计算
 */
function calculateAIProbability(stats) {
  // 权重配置（可调优）
  const weights = {
    burstiness: 0.30,      // 句子长度变化
    ttr: 0.20,             // 词汇丰富度
    punctuation: 0.10,     // 标点模式
    paragraph: 0.10,       // 段落结构
    patterns: 0.30         // AI 句式模板（权重提高）
  };
  
  // Burstiness 评分：低 burstiness = AI
  // 人类 burstiness 通常 > 0.5，AI < 0.3
  // 短文本（<10句）burstiness天然低，需要放宽标准
  let burstinessScore = 0;
  const sentenceCount = stats.metadata?.sentenceCount || 0;
  const shortTextThreshold = sentenceCount < 10 ? 0.2 : 0.3;
  
  if (stats.burstiness.burstiness < shortTextThreshold) {
    burstinessScore = 0.95;  // 很可能是 AI
  } else if (stats.burstiness.burstiness < 0.5) {
    burstinessScore = 0.6;  // 中等可能是 AI
  } else {
    burstinessScore = 0.15;  // 更像人类
  }
  
  // TTR 评分：低 TTR = AI
  // AI TTR 通常 < 0.4，人类 > 0.5
  let ttrScore = 0;
  if (stats.ttr.ttr < 0.4) {
    ttrScore = 0.85;
  } else if (stats.ttr.ttr < 0.5) {
    ttrScore = 0.5;
  } else {
    ttrScore = 0.15;
  }
  
  // 标点评分：标点密度高且稳定 = AI
  let punctScore = 0;
  if (stats.punctuation.punctDensity > 0.05 && stats.punctuation.punctVariety <= 3) {
    punctScore = 0.8;
  } else if (stats.punctuation.punctVariety >= 5) {
    punctScore = 0.3;
  } else {
    punctScore = 0.5;
  }
  
  // 段落评分：段落均匀 = AI
  let paraScore = 0;
  if (stats.paragraph.paraVariance < 100) {
    paraScore = 0.7;
  } else {
    paraScore = 0.3;
  }
  
  // 句式模板评分：模板密度高 = AI
  // 检测到多个模板关键词是AI的强烈信号
  let patternScore = 0;
  const matchedCount = stats.patterns.matchedPatterns.length;
  
  if (matchedCount >= 4) {
    patternScore = 0.98;  // 4个以上模板关键词，几乎肯定是AI
  } else if (matchedCount >= 2) {
    patternScore = 0.85;
  } else if (matchedCount === 1) {
    patternScore = 0.30;  // 只有1个模板，可能是人类正常使用
  } else {
    patternScore = 0.10;
  }
  
  // 加权平均
  const aiProbability = 
    burstinessScore * weights.burstiness +
    ttrScore * weights.ttr +
    punctScore * weights.punctuation +
    paraScore * weights.paragraph +
    patternScore * weights.patterns;
  
  return {
    aiProbability: Math.round(aiProbability * 100),
    humanProbability: Math.round((1 - aiProbability) * 100),
    scores: {
      burstiness: Math.round(burstinessScore * 100),
      ttr: Math.round(ttrScore * 100),
      punctuation: Math.round(punctScore * 100),
      paragraph: Math.round(paraScore * 100),
      patterns: Math.round(patternScore * 100)
    }
  };
}

/**
 * 主检测函数
 */
function detectAIText(text) {
  const { sentences, words } = tokenize(text);
  
  const stats = {
    burstiness: calculateBurstiness(sentences),
    ttr: calculateTTR(words),
    punctuation: analyzePunctuation(text),
    paragraph: analyzeParagraphs(text),
    patterns: detectSentencePatterns(sentences),
    metadata: {
      sentenceCount: sentences.length,
      wordCount: words.length,
      charCount: text.length
    }
  };
  
  const result = calculateAIProbability(stats);
  
  return {
    ...result,
    stats
  };
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: ai-content-detector <text>');
    console.error('   or: ai-content-detector <file>');
    console.error('   or: ai-content-detector --test');
    process.exit(1);
  }
  
  let text;
  
  // 测试模式
  if (args[0] === '--test') {
    console.log('\n=== AI Content Detector Test ===\n');
    
    // AI 文本样例
    const aiText = `首先，我们需要了解人工智能的基本概念。人工智能是指计算机系统模拟人类智能的能力。其次，人工智能在很多领域都有应用，比如医疗、金融、教育等。最后，值得注意的是，人工智能的发展带来了很多机遇和挑战。综上所述，我们应该积极拥抱人工智能技术，同时也要注意其潜在风险。`;
    
    // 人类文本样例（模拟真实写作）
    const humanText = `昨天逛书店，看到一本有意思的书。
书名忘了，但封面设计挺特别的。

翻了几页。文笔很犀利！
作者是个程序员转型的作家，难怪...
技术背景的人写东西，确实不一样。
节奏快，不拖泥带水。
但偶尔也会突然插入一段很长的描写
——可能是想营造氛围？
总之，买了。回家慢慢看。`;
    
    console.log('【AI 文本样例检测】');
    console.log(aiText.slice(0, 100) + '...');
    const aiResult = detectAIText(aiText);
    printResult(aiResult);
    
    console.log('\n【人类文本样例检测】');
    console.log(humanText.slice(0, 100) + '...');
    const humanResult = detectAIText(humanText);
    printResult(humanResult);
    
    return;
  }
  
  // 文件输入
  if (fs.existsSync(args[0])) {
    text = fs.readFileSync(args[0], 'utf-8');
  } else {
    text = args.join(' ');
  }
  
  if (text.length < 50) {
    console.error('⚠️ 文本太短（< 50 字），检测结果不可靠');
  }
  
  const result = detectAIText(text);
  printResult(result);
}

function printResult(result) {
  console.log('\n📊 AI 写作检测结果');
  console.log('━'.repeat(40));
  console.log(`\n🤖 AI 占比: ${result.aiProbability}%`);
  console.log(`👤 人类占比: ${result.humanProbability}%`);
  
  console.log('\n📋 各指标评分（AI 可能性）:');
  console.log(`  句子变化性: ${result.scores.burstiness}%`);
  console.log(`  词汇丰富度: ${result.scores.ttr}%`);
  console.log(`  标点模式: ${result.scores.punctuation}%`);
  console.log(`  段落结构: ${result.scores.paragraph}%`);
  console.log(`  AI 句式模板: ${result.scores.patterns}%`);
  
  console.log('\n📈 统计详情:');
  console.log(`  句子数: ${result.stats.metadata.sentenceCount}`);
  console.log(`  词数: ${result.stats.metadata.wordCount}`);
  console.log(`  字符数: ${result.stats.metadata.charCount}`);
  console.log(`  平均句长: ${result.stats.burstiness.meanLength.toFixed(1)}`);
  console.log(`  句长方差: ${result.stats.burstiness.variance.toFixed(1)}`);
  console.log(`  Burstiness: ${result.stats.burstiness.burstiness.toFixed(3)}`);
  console.log(`  TTR: ${result.stats.ttr.ttr.toFixed(3)}`);
  
  if (result.stats.patterns.matchedPatterns.length > 0) {
    console.log(`\n🔍 检测到 AI 句式模板: ${result.stats.patterns.matchedPatterns.join(', ')}`);
  }
  
  // 结论
  console.log('\n💡 结论:');
  if (result.aiProbability >= 80) {
    console.log('  ⚠️ 高度疑似 AI 生成内容');
  } else if (result.aiProbability >= 60) {
    console.log('  ⚡ 可能包含 AI 生成的部分');
  } else if (result.aiProbability >= 40) {
    console.log('  🔀 混合内容，难以判断');
  } else {
    console.log('  ✅ 更像人类写作');
  }
  
  console.log('\n' + '━'.repeat(40));
}

main();