/**
 * LLM 检索规划：启发式检索结果不足时，用模型解析复杂问句的检索条件
 */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const PLANNER_SYSTEM = `你是地图导览系统的「检索规划器」。只输出 JSON，不要 markdown 或解释。

根据访客问题，提取用于检索地图标点的条件：
{
  "keywords": ["2-10字检索词，如 访美、三个代表、改革开放"],
  "places": ["地名/国家/城市，如 上海、美国、莫斯科"],
  "years": [1997],
  "yearRanges": [{"from": 1997, "to": 2000}],
  "types": ["event" | "spot" | "inscription"],
  "tags": ["标签名，不含#"]
}

规则：
- 只提取问题中明确出现或可合理推断的条件，不要编造具体日期地点
- types 仅在问题明确问足迹/历史事件/题字时填写，否则留空数组
- keywords 优先提取专有名词、主题词，不要填「哪些」「地图」等虚词
- 若问题很宏观，keywords 可填 2-4 个核心主题词`;

function normalizeTypes(types) {
  if (!Array.isArray(types)) return null;
  const valid = types.filter((t) => ['event', 'spot', 'inscription'].includes(t));
  return valid.length ? [...new Set(valid)] : null;
}

export function parsePlannerJson(text) {
  const raw = (text || '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const data = JSON.parse(jsonMatch[0]);
    return {
      keywords: Array.isArray(data.keywords) ? data.keywords.map(String).filter(Boolean) : [],
      places: Array.isArray(data.places) ? data.places.map(String).filter(Boolean) : [],
      titles: [],
      tags: Array.isArray(data.tags) ? data.tags.map(String).filter(Boolean) : [],
      years: Array.isArray(data.years) ? data.years.map(Number).filter(Number.isFinite) : [],
      ranges: Array.isArray(data.yearRanges)
        ? data.yearRanges
            .filter((r) => r && Number.isFinite(r.from) && Number.isFinite(r.to))
            .map((r) => ({ from: Math.min(r.from, r.to), to: Math.max(r.from, r.to) }))
        : [],
      types: normalizeTypes(data.types),
    };
  } catch {
    return null;
  }
}

export async function planRetrievalWithLLM(message, apiKey) {
  const deepseek = createDeepSeek({ apiKey });
  const { text } = await generateText({
    model: deepseek('deepseek-chat'),
    system: PLANNER_SYSTEM,
    prompt: `访客问题：${message}`,
    maxTokens: 350,
    temperature: 0,
  });
  return parsePlannerJson(text);
}
