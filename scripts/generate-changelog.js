#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取 git log
function getGitLog() {
  try {
    const output = execSync('git log --pretty=format:"%ai|%s"', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(line => line.trim());
  } catch (e) {
    console.error('无法读取 git log');
    return [];
  }
}

// 判断是否跳过这个提交
function shouldSkip(message) {
  const skipPatterns = [
    /^Revert/i,
    /^Merge /i,
    /^fixup/i,
    /^squash/i,
  ];
  return skipPatterns.some(p => p.test(message));
}

// 将技术提交消息转换为用户友好的描述
function toUserFriendly(message) {
  // 移除"实现"、"为"等前缀
  let desc = message
    .replace(/^实现/, '')
    .replace(/^为/, '')
    .replace(/^添加/, '')
    .replace(/^新增/, '')
    .replace(/^改进/, '')
    .replace(/^优化/, '')
    .replace(/^修复/, '')
    .replace(/^更新/, '')
    .replace(/^回滚/, '')
    .trim();

  // 移除冒号和中文冒号
  desc = desc.replace(/^[:：]\s*/, '');

  return desc;
}

// 自动分类
function categorize(message) {
  const categories = [
    { pattern: /标记|地点|map|marker/i, type: '地图功能', icon: '🗺️' },
    { pattern: /搜索|search|query/i, type: '搜索功能', icon: '🔍' },
    { pattern: /图片|image|photo|gallery/i, type: '图片功能', icon: '📸' },
    { pattern: /导出|export|download/i, type: '数据功能', icon: '💾' },
    { pattern: /日志|changelog|log/i, type: '日志功能', icon: '📝' },
    { pattern: /界面|UI|样式|style|button|layout/i, type: '界面优化', icon: '🎨' },
    { pattern: /bug|fix|问题|错误|error/i, type: '问题修复', icon: '🔧' },
    { pattern: /性能|performance|速度|optimize/i, type: '性能优化', icon: '⚡' },
  ];

  for (const { pattern, type, icon } of categories) {
    if (pattern.test(message)) {
      return { type, icon };
    }
  }

  return { type: '其他更新', icon: '✨' };
}

// 生成 changelog
function generateChangelog() {
  const logs = getGitLog();
  const entries = {};

  logs.forEach((line) => {
    const [dateTime, ...msgParts] = line.split('|');
    const message = msgParts.join('|').trim();
    const date = dateTime.split(' ')[0];

    if (!message || shouldSkip(message)) return;

    if (!entries[date]) {
      entries[date] = {};
    }

    const { type, icon } = categorize(message);
    const userDesc = toUserFriendly(message);

    if (!userDesc) return;

    const categoryKey = `${icon} ${type}`;
    if (!entries[date][categoryKey]) {
      entries[date][categoryKey] = [];
    }

    // 避免重复
    if (!entries[date][categoryKey].includes(userDesc)) {
      entries[date][categoryKey].push(userDesc);
    }
  });

  // 转换为数组
  const changelog = Object.entries(entries)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([date, categories]) => ({
      date,
      entries: Object.entries(categories).map(([category, items]) => ({
        category,
        items: items.slice(0, 8),
      })),
    }));

  return changelog;
}

// 主函数
function main() {
  console.log('📝 生成更新日志...');
  const changelog = generateChangelog();
  const outputPath = path.join(__dirname, '../public/changelog.json');

  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(changelog, null, 2));
  console.log(`✅ 更新日志已生成`);
}

main();
