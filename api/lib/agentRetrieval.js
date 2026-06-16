/**
 * 导览 Agent 通用检索：语料索引 + 多信号打分 + 渐进放宽
 * 不依赖硬编码地名，随地图数据自动扩展。
 */

import { getMarkerSearchFields } from '../../src/utils/textSearch.js';

const TYPE_HINTS = [
  { pattern: /历史事件|大事记|重大事件|会议|峰会|论坛/, type: 'event' },
  { pattern: /足迹|出访|访问|工作地|出生地|行程|视察|调研/, type: 'spot' },
  { pattern: /题字|题词|书法|墨宝/, type: 'inscription' },
];

const QUESTION_STOPWORDS = new Set([
  '地图', '上有', '哪些', '什么', '相关', '请问', '有没有', '告诉', '介绍', '查询',
  '历史', '事件', '足迹', '题字', '记录', '地点', '帮我', '一下', '如何', '怎么',
  '可以', '是否', '吗', '呢', '的', '在', '有', '和', '与', '是', '了', '这', '那',
  '哪些在', '地图有', '上有哪', '上有哪些', '历史事', '史事件', '请', '帮', '关于',
  '哪些城市', '哪些地方', '哪些国家', '什么时候', '何时', '哪里', '为何', '为什么',
  '之间', '期间', '时候', '地方', '城市', '国家', '地区', '区域', '比较', '对比',
]);

/** @typedef {{ placeList: string[], tagList: string[], titleList: string[] }} MarkerIndex */

/** @typedef {{
 *   places: string[],
 *   tags: string[],
 *   keywords: string[],
 *   years: number[],
 *   ranges: { from: number, to: number }[],
 *   types: string[] | null,
 * }} RetrievalIntent */

export function buildMarkerIndex(markers) {
  const places = new Set();
  const tags = new Set();
  const titles = new Set();

  for (const m of markers) {
    for (const raw of [m.name, m.city, m.province, m.country]) {
      if (!raw || raw.length < 2) continue;
      places.add(raw);
      const stripped = raw.replace(/(特别行政区|自治区|维吾尔|壮族|回族)?(省|市|州|盟|地区)$/, '');
      if (stripped.length >= 2) places.add(stripped);
    }
    for (const t of m.tags || []) {
      if (t && t.length >= 2) tags.add(t);
    }
    if (m.title && m.title.length >= 2) {
      titles.add(m.title);
      for (const seg of m.title.match(/[\u4e00-\u9fff]{2,8}/g) || []) {
        if (seg.length >= 2 && seg.length <= 8) titles.add(seg);
      }
    }
  }

  const byLen = (a, b) => b.length - a.length;
  return {
    placeList: [...places].sort(byLen),
    tagList: [...tags].sort(byLen),
    titleList: [...titles].sort(byLen),
  };
}

export function linkEntitiesFromQuestion(question, index) {
  const places = [];
  const tags = [];
  const titles = [];

  for (const place of index.placeList) {
    if (question.includes(place) && !places.some((p) => p.includes(place) || place.includes(p))) {
      places.push(place);
    }
  }
  for (const tag of index.tagList) {
    if (question.includes(tag) || question.includes(`#${tag}`)) tags.push(tag);
  }
  for (const title of index.titleList) {
    if (title.length >= 4 && question.includes(title)) titles.push(title);
  }

  return { places, tags, titles };
}

export function parseYearsFromQuestion(question) {
  const years = new Set();
  const ranges = [];

  for (const m of question.matchAll(/((?:19|20)\d{2})\s*[-~至到]\s*((?:19|20)\d{2})/g)) {
    ranges.push({ from: Math.min(+m[1], +m[2]), to: Math.max(+m[1], +m[2]) });
  }

  for (const m of question.matchAll(/(?:^|[^\d])((?:19|20)\d{2})(?:年|[^\d]|$)/g)) {
    years.add(+m[1]);
  }

  for (const m of question.matchAll(/((?:19|20)?\d{2})年代/g)) {
    let decade = m[1];
    if (decade.length === 2) decade = (parseInt(decade, 10) >= 30 ? '19' : '20') + decade;
    const start = parseInt(decade, 10);
    if (Number.isFinite(start)) ranges.push({ from: start, to: start + 9 });
  }

  return { years: [...years], ranges };
}

export function inferTypesFromQuestion(question) {
  const types = new Set();
  for (const { pattern, type } of TYPE_HINTS) {
    if (pattern.test(question)) types.add(type);
  }
  return types.size ? [...types] : null;
}

function extractKeywords(question, linked) {
  let text = question;
  for (const term of [...linked.places, ...linked.tags, ...linked.titles]) {
    text = text.split(term).join(' ');
  }
  text = text.replace(/#[\w\u4e00-\u9fff]+/g, ' ');
  text = text.replace(/(?:19|20)\d{2}(?:年|[-~至到]\s*(?:19|20)\d{2})?/g, ' ');

  const keywords = new Set();
  for (const seg of text.match(/[\u4e00-\u9fff]{2,8}/g) || []) {
    if (!QUESTION_STOPWORDS.has(seg)) keywords.add(seg);
  }
  for (const seg of text.match(/[a-zA-Z]{3,}/g) || []) {
    keywords.add(seg.toLowerCase());
  }

  const tags = question.match(/#[\w\u4e00-\u9fff]+/g);
  if (tags) tags.forEach((t) => keywords.add(t.slice(1)));

  return [...keywords].slice(0, 12);
}

function markerYear(marker) {
  const d = marker.date || marker.endDate;
  if (!d) return null;
  const y = parseInt(String(d).slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function markerMatchesYear(marker, intent) {
  const { years, ranges } = intent;
  if (!years.length && !ranges.length) return true;
  const y = markerYear(marker);
  if (y == null) return false;
  if (years.includes(y)) return true;
  return ranges.some((r) => y >= r.from && y <= r.to);
}

function scoreMarker(marker, intent) {
  const fields = getMarkerSearchFields(marker, '').map((f) => String(f ?? '').toLowerCase());
  const blob = fields.join('\n');
  let score = 0;

  for (const place of intent.places) {
    const p = place.toLowerCase();
    if (blob.includes(p)) score += 6;
  }
  for (const tag of intent.tags) {
    if ((marker.tags || []).includes(tag)) score += 10;
    else if (blob.includes(tag.toLowerCase())) score += 5;
  }
  for (const title of intent.titles || []) {
    if (blob.includes(title.toLowerCase())) score += 7;
  }
  for (const kw of intent.keywords) {
    const k = kw.toLowerCase();
    if (blob.includes(k)) score += k.length >= 4 ? 4 : 2;
  }

  if (intent.years.length || intent.ranges.length) {
    score += markerMatchesYear(marker, intent) ? 8 : -3;
  }
  if (intent.types?.includes(marker.type)) score += 3;

  return score;
}

export function buildRetrievalIntent(question, index) {
  const linked = linkEntitiesFromQuestion(question, index);
  const { years, ranges } = parseYearsFromQuestion(question);
  const types = inferTypesFromQuestion(question);
  const keywords = extractKeywords(question, linked);

  return {
    places: linked.places,
    tags: linked.tags,
    titles: linked.titles,
    keywords,
    years,
    ranges,
    types,
  };
}

/** 合并 LLM 规划结果（若有） */
export function mergeRetrievalIntents(base, planned) {
  if (!planned) return base;
  const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];
  return {
    places: uniq([...base.places, ...planned.places]),
    tags: uniq([...base.tags, ...planned.tags]),
    titles: uniq([...(base.titles || []), ...(planned.titles || [])]),
    keywords: uniq([...base.keywords, ...planned.keywords]),
    years: uniq([...base.years, ...planned.years]),
    ranges: [...base.ranges, ...(planned.ranges || [])],
    types: planned.types?.length ? planned.types : base.types,
  };
}

export function retrieveMarkersWithIntent(markers, intent, { limit = 15, minScore = 1 } = {}) {
  const scoreAndRank = (pool, threshold) =>
    pool
      .map((m) => ({ m, score: scoreMarker(m, intent) }))
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(({ m }) => m);

  let pool = markers;
  if (intent.types?.length === 1) {
    const typed = markers.filter((m) => m.type === intent.types[0]);
    const typedHits = scoreAndRank(typed, minScore);
    if (typedHits.length >= 2) pool = typed;
  }

  let hits = scoreAndRank(pool, minScore);

  if (hits.length < 3) {
    hits = scoreAndRank(markers, Math.max(1, minScore - 1));
  }
  if (hits.length === 0 && (intent.places.length || intent.tags.length || intent.keywords.length)) {
    hits = scoreAndRank(markers, 0).filter((m) => scoreMarker(m, intent) > 0);
  }

  return hits.slice(0, limit);
}

export function retrieveMarkers(markers, question) {
  const index = buildMarkerIndex(markers);
  const intent = buildRetrievalIntent(question, index);
  const hits = retrieveMarkersWithIntent(markers, intent);
  return { hits, intent, index };
}
