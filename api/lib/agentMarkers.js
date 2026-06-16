/** 导览 Agent：服务端加载地点并检索（Supabase 优先，否则内置样本） */

import { createClient } from '@supabase/supabase-js';
import { filterBySearch, getMarkerSearchFields } from '../../src/utils/textSearch.js';
import { REMOVED_MARKER_IDS } from '../../src/utils/constants.js';

const removed = new Set(REMOVED_MARKER_IDS);

function buildSearchQueries(message) {
  const q = (message || '').trim();
  const queries = [];
  if (q) queries.push(q);
  const years = q.match(/\b(19|20)\d{2}\b/g);
  if (years) queries.push(...years);
  const tags = q.match(/#[\w\u4e00-\u9fff]+/g);
  if (tags) queries.push(...tags.map((t) => t.slice(1)));
  return [...new Set(queries.filter(Boolean))];
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
  const queries = buildSearchQueries(question);
  const seen = new Set();
  const hits = [];

  for (const q of queries) {
    for (const m of filterBySearch(markers, q, (marker) => getMarkerSearchFields(marker, ''))) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        hits.push(m);
      }
    }
  }

  return hits.slice(0, 12);
}

export function summarizeMarkerForPrompt(m) {
  return {
    id: m.id,
    name: m.name,
    type: m.type,
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
