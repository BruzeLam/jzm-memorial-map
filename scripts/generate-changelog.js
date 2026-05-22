#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取 git log，格式化为 JSON
function getGitLog() {
  try {
    // 获取所有提交，格式：日期|消息
    const output = execSync('git log --pretty=format:"%ai|%s"', { encoding: 'utf-8' });
    return output.trim().split('\n');
  } catch (e) {
    console.error('无法读取 git log:', e.message);
    return [];
  }
}

// 判断是否是有效更新（排除回滚、修复、重构等维护类提交）
function isValidUpdate(message) {
  const skipPatterns = [
    /^Revert/i,          // git revert 产生的提交
    /^Merge /i,           // merge 提交
    /^fixup/i,            // fixup 提交
    /^squash/i,           // squash 提交
    /fix.*eslint/i,       // 仅修复 lint 的提交
    /^修复.*warning/i,    // 修复警告
    /^更新.*hook/i,       // 更新 hook 或配置
  ];

  // 检查是否匹配跳过模式
  if (skipPatterns.some(pattern => pattern.test(message))) {
    return false;
  }

  // 至少要有实质内容
  return message.length > 5;
}

// 从消息提取类别和描述
function parseMessage(message) {
  // 清理消息
  let desc = message.trim();

  // 检测中文关键词
  const chineseKeywords = [
    { pattern: /^实现|^添加|^新增|^为/, category: '✨ 功能' },
    { pattern: /^改进|^优化|^规范/, category: '📋 优化' },
    { pattern: /^修复|^fix/, category: '🔧 修复' },
    { pattern: /^更新|^update/, category: '📝 更新' },
    { pattern: /^回滚|^Revert/, category: '⏮️ 回滚' },
    { pattern: /^移除|^删除/, category: '🗑️ 移除' },
  ];

  let category = null;
  for (const { pattern, category: cat } of chineseKeywords) {
    if (pattern.test(desc)) {
      category = cat;
      // 移除前缀（比如"实现"、"添加"等）
      desc = desc.replace(/^(实现|添加|新增|为|改进|优化|规范|修复|更新|回滚|移除|update|fix)[:：]?\s*/, '');
      break;
    }
  }

  // 默认分类
  if (!category) {
    category = '📝 更新';
  }

  return { category, description: desc.slice(0, 60) }; // 限制长度
}


// 生成 changelog
function generateChangelog() {
  const logs = getGitLog();
  const entries = {};

  logs.forEach((line) => {
    if (!line.trim()) return;

    const [dateTime, ...messageParts] = line.split('|');
    const message = messageParts.join('|').trim();
    const date = dateTime.split(' ')[0]; // 提取日期部分

    // 判断是否有效更新
    if (!isValidUpdate(message)) return;

    // 初始化日期条目
    if (!entries[date]) {
      entries[date] = {};
    }

    // 解析消息
    const { category, description } = parseMessage(message);

    // 按类别分组
    if (!entries[date][category]) {
      entries[date][category] = [];
    }

    // 避免重复
    if (!entries[date][category].includes(description)) {
      entries[date][category].push(description);
    }
  });

  // 转换为数组格式，按日期倒序排列
  const changelog = Object.entries(entries)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([date, categories]) => ({
      date,
      entries: Object.entries(categories).map(([category, items]) => ({
        category,
        items: items.slice(0, 5), // 每个类别最多显示5个
      })),
    }));

  return changelog;
}

// 主函数
function main() {
  console.log('📝 生成更新日志...');

  const changelog = generateChangelog();
  const outputPath = path.join(__dirname, '../public/changelog.json');

  // 创建 public 目录如果不存在
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(outputPath, JSON.stringify(changelog, null, 2));

  console.log(`✅ 更新日志已生成: ${changelog.length} 天的更新`);
  console.log(`📁 保存位置: ${outputPath}`);
}

main();
