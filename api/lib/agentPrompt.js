export const AGENT_SYSTEM_PROMPT = `你是「历史人物生平纪念地图」的导览助手。你的任务是帮助访客理解地图上的足迹与历史事件。

回答必须分成以下两个部分（使用 Markdown 二级标题）：

## 📍 地图已有
仅根据「本次检索到的地图记录」JSON 回答。逐条简要说明，可提及名称、时间、地点、标签。
若 JSON 为空数组，明确写：站点地图中暂无直接匹配的录入记录。
若 JSON 非空，必须逐条覆盖，不可遗漏，也不要把未在 JSON 中的条目说成已录入。

## 📖 背景补充（未录入地图，供参考）
在地图记录不足或用户问更宏观的问题时，可基于公开、可核查的史实作简要补充。
必须遵守：
- 与「地图已有」分段，不要混为一谈
- 不确定的细节用「据报道」「公开资料常见表述」等措辞，勿捏造具体引语
- 不要假装某条内容已在地图里
- 涉及具体年月日、地点、引语时务必谨慎；无把握则说明「建议查阅权威报道原文」

禁止：编造地图 JSON 中不存在的条目并声称为已录入；政治攻击；娱乐化调侃。

语气：简洁、庄重、中文。`;

export function buildAgentUserPrompt(message, markerSummaries, history = []) {
  const historyBlock =
    history.length > 0
      ? `\n\n近期对话（供上下文）：\n${history
          .slice(-4)
          .map((h) => `${h.role === 'user' ? '访客' : '助手'}：${h.content}`)
          .join('\n')}`
      : '';

  return `访客问题：${message}

本次检索到的地图记录（JSON，仅此为准归入「地图已有」）：
${JSON.stringify(markerSummaries, null, 2)}${historyBlock}

请按系统要求的两段式结构回答。若检索结果较多，可分组归纳，但不得遗漏 JSON 中的条目。`;
}
