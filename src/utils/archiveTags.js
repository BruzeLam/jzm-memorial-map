/** 档案馆全局标签词库（localStorage） */

import { getStorageKeys } from '../config/branding';

export const TAG_REGISTRY_KEY = getStorageKeys().archiveTags;

const MAX_TAG_LEN = 40;
const MAX_TAGS_PER_DOC = 30;

export function normalizeTagName(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (s.startsWith('#')) s = s.slice(1).trim();
  s = s.replace(/\s+/g, ' ');
  if (!s) return '';
  if (s.length > MAX_TAG_LEN) s = s.slice(0, MAX_TAG_LEN);
  return s;
}

export function normalizeTagList(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const t of tags) {
    const n = normalizeTagName(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= MAX_TAGS_PER_DOC) break;
  }
  return out;
}

export function readTagRegistry() {
  try {
    const raw = localStorage.getItem(TAG_REGISTRY_KEY);
    if (!raw) return [];
    return normalizeTagList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeTagRegistry(tags) {
  localStorage.setItem(TAG_REGISTRY_KEY, JSON.stringify(normalizeTagList(tags)));
}

/** 合并词库与当前文献中的标签，按中文排序 */
export function collectAllTags(archives = []) {
  const set = new Set(readTagRegistry());
  for (const a of archives) {
    for (const t of a.tags || []) {
      const n = normalizeTagName(t);
      if (n) set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function registerTags(tagList) {
  const merged = normalizeTagList([...readTagRegistry(), ...tagList]);
  writeTagRegistry(merged);
  return merged;
}

/** 从输入框解析待添加的标签（支持 #tag 或纯文本） */
export function parseTagInput(input) {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  if (raw.includes('#')) {
    const afterHash = raw.split('#').pop()?.trim() ?? '';
    return normalizeTagName(afterHash);
  }
  return normalizeTagName(raw);
}

export function filterTagSuggestions(allTags, query, selectedTags = []) {
  const selected = new Set(selectedTags);
  const q = normalizeTagName(query).toLowerCase();
  const pool = allTags.filter((t) => !selected.has(t));
  if (!q) return pool.slice(0, 10);
  return pool
    .filter((t) => t.toLowerCase().includes(q))
    .slice(0, 10);
}
