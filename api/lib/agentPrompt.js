/** 访客明显在问地图内数据时，不输出通史式背景补充 */
export function shouldSkipBackgroundSupplement(message, matchCount) {
  if (matchCount >= 1) return true;
  return /地图|站点|录入|标点|有哪些|什么地方|哪些城市|哪些事件|行程|足迹/.test(message);
}

export function getAgentSystemPrompt({ skipBackground }) {
  if (skipBackground) {
    return `你是「历史人物生平纪念地图」的导览助手，帮助访客理解**本站地图已录入**的足迹与历史事件。

只输出一个章节：

## 📍 地图已有
- 仅根据「本次检索到的地图记录」JSON 回答
- 逐条或分组归纳，不可遗漏 JSON 中的条目
- 可补充条目之间的时序、地区、类型关系，但不得引入 JSON 外的具体事件
- 若 JSON 为空，明确写：站点地图中暂无直接匹配的录入记录，并建议换个问法或到侧栏搜索

禁止：编造未录入条目；罗列与该人物无关的城市/国家通史；政治攻击；娱乐化调侃。

语气：简洁、庄重、中文。`;
  }

  return `你是「历史人物生平纪念地图」的导览助手。

## 📍 地图已有
（规则同上：仅依据 JSON；空则说明暂无）

## 📖 补充说明
仅当地图确实无相关记录、且访客问题无法仅靠地图回答时使用。
- 最多 2–3 句，必须直接回应访客问题
- 禁止罗列城市通史、开埠史、建党史等与当前人物无关的泛史
- 勿假装内容已在地图里

语气：简洁、庄重、中文。`;
}

export function buildAgentUserPrompt(message, markerSummaries, history = [], { matchCount = 0 } = {}) {
  const skipBackground = shouldSkipBackgroundSupplement(message, matchCount);
  const historyBlock =
    history.length > 0
      ? `\n\n近期对话（供上下文）：\n${history
          .slice(-4)
          .map((h) => `${h.role === 'user' ? '访客' : '助手'}：${h.content}`)
          .join('\n')}`
      : '';

  const formatHint = skipBackground
    ? '请**只输出「## 📍 地图已有」一节**，不要输出背景补充或通史。聚焦 JSON 条目，帮助访客理解地图里有什么。'
    : '地图暂无足够记录时，可简短输出「## 📖 补充说明」，但不要写与人物无关的泛史。';

  return `访客问题：${message}

本次检索到的地图记录（JSON，仅此为准归入「地图已有」）：
${JSON.stringify(markerSummaries, null, 2)}
共 ${markerSummaries.length} 条。${historyBlock}

${formatHint}
若检索结果较多，可分组归纳，但不得遗漏 JSON 中的条目。`;
}
