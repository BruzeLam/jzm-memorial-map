import { isAggregateQuestion } from './agentStats.js';

/** 访客明显在问地图内数据时，不输出通史式背景补充 */
export function shouldSkipBackgroundSupplement(message, matchCount) {
  if (matchCount >= 1) return true;
  if (isAggregateQuestion(message)) return true;
  if (/他|她|长者|这位|其人|同志|泽民|地图|站点|录入|标点|有哪些|足迹|行程|出访|访问/.test(message)) {
    return true;
  }
  return /地图|站点|录入|标点|有哪些|什么地方|哪些城市|哪些事件|行程|足迹/.test(message);
}

function subjectContextBlock(subject) {
  return `【站点语境】
- 本站：${subject.siteLabel}
- 主题人物：${subject.name}
- 访客说的「他/她/长者/这位/其/其人」一律指 ${subject.name}，**禁止**要求访客补充或确认姓名。`;
}

export function getAgentSystemPrompt({ skipBackground, subject, aggregate = false }) {
  const subjectBlock = subjectContextBlock(subject);
  const aggregateRule = aggregate
    ? `\n- 本条为**汇总统计问题**：只依据「地图统计摘要」中的全库 ${aggregate ? '数据' : ''}回答数字与国家/地区列表
- 禁止用明细 JSON 的条数代替全库统计；禁止声称「仅有若干条记录」`
    : '';

  if (skipBackground) {
    return `你是「历史人物生平纪念地图」的导览助手，帮助访客理解**本站地图已录入**的足迹与历史事件。

${subjectBlock}

只输出一个章节：

## 📍 地图已有
- 优先使用「地图统计摘要」回答多少/哪些国家/城市等汇总问题
- 明细条目以「检索到的地图记录」JSON 为准，可分组归纳
- 全库标点总数见统计摘要 totalMarkers，与明细 JSON 条数无关
${aggregateRule}
- 汇总回答须给出具体数字与列表（如国家名），不要空泛

禁止：编造未录入条目；要求访客提供人物姓名；罗列与该人物无关的城市/国家通史；政治攻击；娱乐化调侃。

语气：简洁、庄重、中文。`;
  }

  return `你是「历史人物生平纪念地图」的导览助手。

${subjectBlock}

## 📍 地图已有
（规则同上：统计摘要 + JSON 明细；空则说明暂无）

## 📖 补充说明
仅当地图确实无相关记录、且访客问题无法仅靠地图回答时使用。
- 最多 2–3 句，必须直接回应访客问题
- 禁止罗列城市通史；勿假装内容已在地图里；勿要求补充姓名

语气：简洁、庄重、中文。`;
}

export function buildAgentUserPrompt(
  message,
  markerSummaries,
  history = [],
  { matchCount = 0, catalogSize = 0, statistics = null, subject, aggregate = false } = {}
) {
  const skipBackground = shouldSkipBackgroundSupplement(message, matchCount);
  const historyBlock =
    history.length > 0
      ? `\n\n近期对话（供上下文）：\n${history
          .slice(-4)
          .map((h) => `${h.role === 'user' ? '访客' : '助手'}：${h.content}`)
          .join('\n')}`
      : '';

  const statsBlock = statistics
    ? `\n\n地图统计摘要（汇总类问题**唯一依据**，基于全库 ${catalogSize || statistics.totalMarkers} 条标点）：\n${JSON.stringify(statistics, null, 2)}`
    : '';

  const detailBlock = aggregate
    ? `\n（汇总问题：下方无明细 JSON，请仅依据统计摘要回答；地图跳转按钮由系统另行生成。）`
    : `\n\n本次检索到的地图记录（JSON）：\n${JSON.stringify(markerSummaries, null, 2)}\n共 ${markerSummaries.length} 条（全库 ${catalogSize} 条）。`;

  const formatHint = aggregate
    ? '请**只输出「## 📍 地图已有」一节**。直接引用统计摘要中的 distinctForeignCountries / foreignCountries 等字段回答，并列出国家名称。'
    : skipBackground
      ? '请**只输出「## 📍 地图已有」一节**。逐条解读 JSON 或归纳分组。'
      : '地图暂无足够记录时，可简短输出「## 📖 补充说明」，但不要写与人物无关的泛史，也不要要求补充姓名。';

  return `访客问题：${message}
（问题中的代词已理解为指 ${subject.name}）${detailBlock}${statsBlock}${historyBlock}

${formatHint}`;
}
