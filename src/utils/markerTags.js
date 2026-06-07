/** 地图地点标签词库（与档案馆标签独立） */

import { getStorageKeys } from '../config/branding';

export const MARKER_TAG_REGISTRY_KEY = getStorageKeys().markerTags;

const MAX_TAG_LEN = 40;
const MAX_TAGS_PER_MARKER = 30;

export function normalizeMarkerTagName(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (s.startsWith('#')) s = s.slice(1).trim();
  s = s.replace(/\s+/g, ' ');
  if (!s) return '';
  if (s.length > MAX_TAG_LEN) s = s.slice(0, MAX_TAG_LEN);
  return s;
}

export function normalizeMarkerTagList(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const t of tags) {
    const n = normalizeMarkerTagName(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= MAX_TAGS_PER_MARKER) break;
  }
  return out;
}

export function readMarkerTagRegistry() {
  try {
    const raw = localStorage.getItem(MARKER_TAG_REGISTRY_KEY);
    if (!raw) return [];
    return normalizeMarkerTagList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeMarkerTagRegistry(tags) {
  localStorage.setItem(MARKER_TAG_REGISTRY_KEY, JSON.stringify(normalizeMarkerTagList(tags)));
}

export function collectAllMarkerTags(markers = []) {
  const set = new Set(readMarkerTagRegistry());
  for (const m of markers) {
    for (const t of m.tags || []) {
      const n = normalizeMarkerTagName(t);
      if (n) set.add(n);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function registerMarkerTags(tagList) {
  const merged = normalizeMarkerTagList([...readMarkerTagRegistry(), ...tagList]);
  writeMarkerTagRegistry(merged);
  return merged;
}

export function parseMarkerTagInput(input) {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  if (raw.includes('#')) {
    const afterHash = raw.split('#').pop()?.trim() ?? '';
    return normalizeMarkerTagName(afterHash);
  }
  return normalizeMarkerTagName(raw);
}

export function filterMarkerTagSuggestions(allTags, query, selectedTags = []) {
  const selected = new Set(selectedTags);
  const q = normalizeMarkerTagName(query).toLowerCase();
  const pool = allTags.filter((t) => !selected.has(t));
  if (!q) return pool.slice(0, 10);
  return pool.filter((t) => t.toLowerCase().includes(q)).slice(0, 10);
}
