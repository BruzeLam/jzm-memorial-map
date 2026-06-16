/** 导览 Agent：服务端加载地点并检索（Supabase 优先，否则内置样本） */

import { createClient } from '@supabase/supabase-js';
import { filterBySearch, getMarkerSearchFields } from '../../src/utils/textSearch.js';
import { REMOVED_MARKER_IDS } from '../../src/utils/constants.js';

const removed = new Set(REMOVED_MARKER_IDS);

const TYPE_HINTS = [
  { pattern: /历史事件|大事记|重大事件/, type: 'event' },
  { pattern: /足迹|出访|访问|工作地|出生地|行程/, type: 'spot' },
  { pattern: /题字|题词|书法/, type: 'inscription' },
];

const QUESTION_STOPWORDS = new Set([
  '地图', '上有', '哪些', '什么', '相关', '请问', '有没有', '告诉', '介绍', '查询',
  '历史', '事件', '足迹', '题字', '记录', '地点', '帮我', '一下', '如何', '怎么',
  '可以', '是否', '吗', '呢', '的', '在', '有', '和', '与', '是', '了', '这', '那',
  '哪些在', '地图有', '上有哪', '上有哪些', '历史事', '史事件',
]);

function inferTypeFilter(question) {
  for (const { pattern, type } of TYPE_HINTS) {
    if (pattern.test(question)) return type;
  }
  return null;
}

/** 从自然语言问题中提取可检索关键词（勿整句匹配） */
export function extractAgentSearchQueries(message) {
  const q = (message || '').trim();
  if (!q) return [];

  const queries = new Set();

  const years = q.match(/(?:^|[^\d])((?:19|20)\d{2})(?:年|[^\d]|$)/g);
  if (years) {
    for (const raw of years) {
      const y = raw.match(/((?:19|20)\d{2})/);
      if (y) queries.add(y[1]);
    }
  }

  const tags = q.match(/#[\w\u4e00-\u9fff]+/g);
  if (tags) tags.forEach((t) => queries.add(t.slice(1)));

  const inLoc = q.match(/在([\u4e00-\u9fff]{2,8}?)(的|市|省|发生|举办|举行|进行)/);
  if (inLoc?.[1]) {
    const loc = inLoc[1];
    queries.add(loc);
    if (!/[省市]$/.test(loc)) queries.add(`${loc}市`);
  }

  for (const m of q.matchAll(/([\u4e00-\u9fff]{2,6})(?:市|省)/g)) {
    queries.add(m[1]);
    queries.add(m[0]);
  }

  for (const seg of q.match(/[\u4e00-\u9fff]{2,6}/g) || []) {
    if (!QUESTION_STOPWORDS.has(seg)) queries.add(seg);
  }

  return [...queries]
    .filter((term) => term.length >= 2 && term.length <= 8)
    .slice(0, 10);
}

function scoreMarker(marker, queries) {
  const fields = getMarkerSearchFields(marker, '').map((f) => String(f ?? '').toLowerCase());
  let score = 0;
  for (const query of queries) {
    const term = query.toLowerCase().trim();
    if (!term) continue;
    for (const field of fields) {
      if (field.includes(term)) {
        score += term.length >= 3 ? 3 : 1;
        break;
      }
    }
  }
  return score;
}

export async function loadMarkersForAgent() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('markers').select('id, payload');
      if (!error && data?.length) {
        return data
          .map((row) => row.payload)
          .filter((m) => m?.id && !removed.has(m.id));
      }
    } catch (_) {
      /* fallback below */
    }
  }

  const { SAMPLE_MARKERS } = await import('../../src/utils/constants.js');
  return SAMPLE_MARKERS.filter((m) => !removed.has(m.id));
}

export function searchMarkersForAgent(markers, question) {
  const queries = extractAgentSearchQueries(question);
  const typeFilter = inferTypeFilter(question);

  if (queries.length === 0) return [];

  const rankPool = (pool) => {
    const scored = pool
      .map((m) => ({ m, score: scoreMarker(m, queries) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map(({ m }) => m);
  };

  let hits = rankPool(typeFilter ? markers.filter((m) => m.type === typeFilter) : markers);

  if (hits.length === 0 && typeFilter) {
    hits = rankPool(markers);
  }

  if (hits.length === 0) {
    for (const q of queries) {
      for (const m of filterBySearch(markers, q, (marker) => getMarkerSearchFields(marker, ''))) {
        if (!hits.some((h) => h.id === m.id)) hits.push(m);
      }
    }
  }

  return hits.slice(0, 12);
}

export function summarizeMarkerForPrompt(m) {
  const typeLabels = { spot: '足迹', event: '历史事件', inscription: '题字' };
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    typeLabel: typeLabels[m.type] || m.type,
    date: m.date || null,
    endDate: m.endDate || null,
    title: m.title || null,
    tags: m.tags || [],
    region: [m.country, m.province, m.city].filter(Boolean).join(' / ') || null,
    description: (m.description || m.tripSummary || '').slice(0, 280) || null,
  };
}

export function toMapHits(markers) {
  return markers.map((m) => ({
    id: m.id,
    name: m.name,
    date: m.date || null,
    title: m.title || null,
  }));
}
